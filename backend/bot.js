const TelegramBotModule = require('node-telegram-bot-api');
const jwt = require('jsonwebtoken');

const TelegramBot = TelegramBotModule.default || TelegramBotModule.TelegramBot || TelegramBotModule;

let bot = null;
let handlersRegistered = false;

function buildLoginUrl(msg) {
  const token = jwt.sign(
    {
      type: 'telegram-link',
      telegramId: String(msg.chat.id),
      username: msg.chat.username || '',
      name: [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(' ')
    },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '10m' }
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl.replace(/\/$/, '')}/?token=${encodeURIComponent(token)}`;
}

function initBot(io, options = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN is not configured.');
    return null;
  }

  if (!bot) {
    bot = new TelegramBot(token, { polling: options.polling !== false });
  }

  if (handlersRegistered) return bot;
  handlersRegistered = true;

  bot.on('message', async msg => {
    const chatId = msg.chat?.id;
    if (!chatId) return;

    try {
      if ((msg.text || '').startsWith('/start')) {
        return await bot.sendMessage(
          chatId,
          'Xush kelibsiz! Saytga xavfsiz kirish uchun quyidagi tugmani bosing:',
          {
            reply_markup: {
              inline_keyboard: [[{ text: 'Saytni ochish', url: buildLoginUrl(msg) }]]
            }
          }
        );
      }

      return await bot.sendMessage(chatId, 'Saytga kirish uchun /start buyrug\'ini yuboring.');
    } catch (error) {
      console.error('[Telegram Bot] Message handler error:', error.message);
    }
  });

  bot.on('polling_error', error => {
    console.error('[Telegram Bot] Polling error:', error.message);
  });

  console.log('[Telegram Bot] Initialized.');
  return bot;
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
