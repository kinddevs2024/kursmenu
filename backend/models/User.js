const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  telegramCode: { type: String }, // 6‑digit verification code
  telegramCodeExpires: { type: Date },
  loginToken: { type: String }, // Token for auto-login via link
  username: { type: String },
  name: { type: String },
  phone: { type: String },
  email: { type: String },
  googleId: { type: String },
  roles: { type: [String], default: [] },
  isPremium: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
