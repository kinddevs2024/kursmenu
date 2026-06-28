const tb = require('node-telegram-bot-api');
const TelegramBot = tb.default || tb.TelegramBot || tb;
const User = require('./models/User');
const crypto = require('crypto');

let bot = null;

// In-memory state for bot registration flow
const userStates = {};

function initBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN is not configured. Telegram login will run in MOCK mode.');
    return;
  }

  try {
    bot = new TelegramBot(token, { polling: true });

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text || '';
      const telegramId = String(chatId);
      const username = msg.chat.username || '';

      // Handle /start
      if (text.startsWith('/start')) {
        const existingUser = await User.findOne({ telegramId });
        if (existingUser && existingUser.name && existingUser.phone) {
          const loginToken = crypto.randomBytes(32).toString('hex');
          existingUser.loginToken = loginToken;
          await existingUser.save();
          
          const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?token=${loginToken}`;
          
          try {
            await bot.sendMessage(
              chatId,
              `👋 Xush kelibsiz, ${existingUser.name}!\n\nSaytga avtomat kirish uchun quyidagi tugmani bosing:`,
              { 
                reply_markup: { 
                  inline_keyboard: [[{ text: '👉 Ochish', url: loginUrl }]]
                } 
              }
            );
          } catch (e) {
            console.error(e);
          }
          return;
        }

        userStates[chatId] = { step: 'ASK_NAME', username };
        return bot.sendMessage(
          chatId,
          '👋 Xush kelibsiz! Iltimos, ismingizni kiriting:'
        );
      }

      // Handle state machine
      const state = userStates[chatId];
      if (state) {
        if (state.step === 'ASK_NAME') {
          state.name = text;
          state.step = 'ASK_PHONE';
          
          return bot.sendMessage(
            chatId,
            `Rahmat, ${state.name}! Endi telefon raqamingizni yuboring:`,
            {
              reply_markup: {
                keyboard: [
                  [{ text: '📱 Telefon raqamni yuborish', request_contact: true }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
              }
            }
          );
        }

        if (state.step === 'ASK_PHONE' && msg.contact) {
          const phone = msg.contact.phone_number;
          
          try {
            const loginToken = crypto.randomBytes(32).toString('hex');
            
            // Upsert user
            await User.findOneAndUpdate(
              { telegramId },
              { 
                username: state.username,
                name: state.name,
                phone: phone,
                loginToken: loginToken
              },
              { upsert: true, new: true }
            );

            // Clean state
            delete userStates[chatId];

            const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?token=${loginToken}`;

            // First remove keyboard if any
            try {
              await bot.sendMessage(chatId, `✅ Muvaffaqiyatli ro'yxatdan o'tdingiz!`, { reply_markup: { remove_keyboard: true } });
              await bot.sendMessage(
                chatId,
                `Saytga avtomat kirish uchun quyidagi tugmani bosing:`,
                { 
                  reply_markup: { 
                    inline_keyboard: [[{ text: '👉 Ochish', url: loginUrl }]]
                  } 
                }
              );
            } catch (e) {
              console.error(e);
            }
            return;
          } catch (err) {
            console.error('Error saving user in bot:', err);
            return bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Iltimos qayta /start bosing.');
          }
        }
      }
    });

    bot.on('polling_error', (error) => {
      console.error('[Telegram Bot] Polling error:', error.message);
    });

    console.log('🤖 Telegram Bot successfully initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize Telegram Bot:', error.message);
  }
}

module.exports = {
  initBot,
  getBotInstance: () => bot
};
