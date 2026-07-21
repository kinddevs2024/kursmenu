const tb = require('node-telegram-bot-api');
const TelegramBot = tb.default || tb.TelegramBot || tb;
const User = require('./models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

let bot = null;
let globalIo = null;
let handlersRegistered = false;

function initBot(io, options = {}) {
  if (io) globalIo = io;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN is not configured. Telegram login will run in MOCK mode.');
    return;
  }

  try {
    if (!bot) {
      bot = new TelegramBot(token, { polling: options.polling !== false });
    }

    if (handlersRegistered) return bot;
    handlersRegistered = true;

    bot.on('message', async (msg) => {
      try {
      const chatId = msg.chat.id;
      const text = msg.text || '';
      const telegramId = String(chatId);
      const username = msg.chat.username || '';

      // Handle /start
      if (text.startsWith('/start')) {
        let sessionId = null;
        if (text.includes('login_')) {
          sessionId = text.split('login_')[1];
        }

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

        await User.findOneAndUpdate(
          { telegramId },
          { $set: { username, botStep: 'ASK_NAME', botSessionId: sessionId || '' } },
          { upsert: true, new: true }
        );
        return bot.sendMessage(
          chatId,
          '👋 Xush kelibsiz! Iltimos, ismingizni kiriting:'
        );
      }

      // Handle state machine
      const state = await User.findOne({ telegramId });
      if (state?.botStep) {
        if (state.botStep === 'ASK_NAME') {
          state.name = text;
          state.botStep = 'ASK_PHONE';
          await state.save();
          
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

        if (state.botStep === 'ASK_PHONE' && msg.contact) {
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
                loginToken: loginToken,
                botStep: '',
                botSessionId: ''
              },
              { upsert: true, new: true }
            );

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
      } catch (error) {
        const chatId = msg.chat?.id;
        console.error('[Telegram Bot] Message handler error:', error.message);
        if (chatId) {
          await bot.sendMessage(
            chatId,
            'Bot ishlayapti, lekin ma\'lumotlar bazasiga ulanish vaqtincha kechikmoqda. Iltimos, /start buyrug\'ini yana yuboring.'
          ).catch(sendError => console.error('[Telegram Bot] Send error:', sendError.message));
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
  getBotInstance: () => bot,
  processUpdate(update) {
    if (!bot) initBot(null, { polling: false });
    if (!bot) throw new Error('Telegram bot is not configured');
    bot.processUpdate(update);
  }
};
