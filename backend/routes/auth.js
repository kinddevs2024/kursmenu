const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getBotInstance } = require('../bot');

// Helper to generate 6‑digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const fs = require('fs');
const path = require('path');
const https = require('https');

async function fetchAvatar(telegramId, bot) {
  try {
    const photos = await bot.getUserProfilePhotos(telegramId, { limit: 1 });
    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      const fileLink = await bot.getFileLink(fileId);
      
      const avatarsDir = path.join(__dirname, '../public/uploads/avatars');
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }
      
      const filename = `${telegramId}_avatar.jpg`;
      const filepath = path.join(avatarsDir, filename);
      
      return new Promise((resolve) => {
        const file = fs.createWriteStream(filepath);
        https.get(fileLink, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close(() => resolve(`/uploads/avatars/${filename}`));
          });
        }).on('error', (err) => {
          fs.unlink(filepath, () => {});
          resolve(null);
        });
      });
    }
  } catch (err) {
    console.error('Error fetching avatar:', err.message);
  }
  return null;
}

// POST /api/auth/start - initiate Telegram verification (Code Login)
router.post('/start', async (req, res) => {
  const { telegramId } = req.body; // Can be username or ID
  if (!telegramId) return res.status(400).json({ error: 'Telegram Username yoki ID kiriting' });
  
  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  
  try {
    // Find user by username or telegramId
    let user = await User.findOne({ 
      $or: [
        { username: telegramId.replace('@', '') },
        { telegramId: telegramId }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi. Avval Telegram botimizdan ro\'yxatdan o\'ting.' });
    }

    user.telegramCode = code;
    user.telegramCodeExpires = expires;

    // Send code via Telegram Bot and fetch avatar
    const bot = getBotInstance();
    if (bot) {
      try {
        await bot.sendMessage(
          user.telegramId, // Must be numeric ID
          `🔐 Saytga kirish uchun tasdiqlash kodi:\n\n👉 *${code}* 👈\n\n🕒 Kod 10 daqiqa amal qiladi.`,
          { parse_mode: 'Markdown' }
        );
        console.log(`Sent code ${code} to ${user.telegramId}`);

        // Try fetching avatar
        const newAvatar = await fetchAvatar(user.telegramId, bot);
        if (newAvatar) {
          user.photoUrl = newAvatar;
        }
      } catch (botErr) {
        console.error('Failed to send telegram message or fetch avatar:', botErr.message);
        return res.status(500).json({ error: 'Telegram orqali xabar yuborishda xatolik. Botni bloklamaganligingizni tekshiring.' });
      }
    } else {
      console.warn(`Bot not running. Mock code: ${code}`);
    }

    await user.save();
    res.json({ message: 'Verification code sent via Telegram' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ichki server xatosi' });
  }
});

// POST /api/auth/verify - verify 6-digit code
router.post('/verify', async (req, res) => {
  const { telegramId, code } = req.body;
  if (!telegramId || !code) return res.status(400).json({ error: 'telegramId and code required' });
  try {
    const user = await User.findOne({ 
      $or: [
        { username: telegramId.replace('@', '') },
        { telegramId: telegramId }
      ],
      telegramCode: code 
    });
    
    if (!user) return res.status(401).json({ error: 'Noto\'g\'ri kod' });
    if (user.telegramCodeExpires < new Date()) return res.status(401).json({ error: 'Kod muddati tugagan' });
    
    // Clear code after use
    user.telegramCode = undefined;
    user.telegramCodeExpires = undefined;
    await user.save();
    
    const accessToken = jwt.sign({ sub: user._id, roles: user.roles, isPremium: user.isPremium, photoUrl: user.photoUrl }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TTL || '15m' });
    const refreshToken = jwt.sign({ sub: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_TTL || '7d' });
    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/link-login - login via url token from bot
router.post('/link-login', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  try {
    const user = await User.findOne({ loginToken: token });
    if (!user) return res.status(401).json({ error: 'Yaroqsiz yoki eskirgan token' });

    // Clear the token so it can only be used once
    user.loginToken = undefined;
    await user.save();

    const accessToken = jwt.sign({ sub: user._id, roles: user.roles, isPremium: user.isPremium, photoUrl: user.photoUrl }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TTL || '15m' });
    const refreshToken = jwt.sign({ sub: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_TTL || '7d' });
    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me - refresh user token
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const accessToken = jwt.sign({ sub: user._id, roles: user.roles, isPremium: user.isPremium, photoUrl: user.photoUrl }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TTL || '15m' });
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
