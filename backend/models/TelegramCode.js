const mongoose = require('mongoose');

const TelegramCodeSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  username: { type: String },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 minutes TTL
});

module.exports = mongoose.model('TelegramCode', TelegramCodeSchema);
