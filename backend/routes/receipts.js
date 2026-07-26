const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { put, list, del } = require('@vercel/blob');
const { getBotInstance } = require('../bot');
const { saveTelegramUser } = require('../lib/telegramUserStore');

const router = express.Router();
const RECEIPT_DATA_PREFIX = 'receipts/data/';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  }
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

async function saveReceipt(receipt) {
  await put(`${RECEIPT_DATA_PREFIX}${receipt._id}.json`, JSON.stringify(receipt), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
    cacheControlMaxAge: 60
  });
}

async function getReceipt(id) {
  const { blobs } = await list({ prefix: `${RECEIPT_DATA_PREFIX}${id}.json`, limit: 1 });
  if (!blobs.length) return null;
  const response = await fetch(`${blobs[0].url}?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Receipt metadata fetch failed: ${response.status}`);
  return response.json();
}

async function getReceipts() {
  const receipts = [];
  let cursor;

  do {
    const page = await list({ prefix: RECEIPT_DATA_PREFIX, limit: 1000, cursor });
    const pageReceipts = await Promise.all(page.blobs.map(async (blob) => {
      const response = await fetch(`${blob.url}?v=${Date.now()}`, { cache: 'no-store' });
      return response.ok ? response.json() : null;
    }));
    receipts.push(...pageReceipts.filter(Boolean));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return receipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

router.post('/upload', authMiddleware, upload.single('receipt'), async (req, res) => {
  let uploadedBlob;
  try {
    if (!req.file) return res.status(400).json({ error: 'JPG, PNG yoki WEBP rasm yuklang' });
    if (!req.body.courseId) return res.status(400).json({ error: 'Course ID is required' });

    const id = crypto.randomUUID();
    const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[req.file.mimetype];
    uploadedBlob = await put(`receipts/images/${id}.${extension}`, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      addRandomSuffix: true
    });

    const receipt = {
      _id: id,
      userId: {
        _id: req.user.sub,
        telegramId: req.user.telegramId || null,
        username: req.user.username || '',
        name: req.user.name || req.user.username || 'Telegram user'
      },
      courseId: req.body.courseId,
      receiptUrl: uploadedBlob.url,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await saveReceipt(receipt);

    const bot = getBotInstance();
    if (bot && receipt.userId.telegramId) {
      bot.sendMessage(
        receipt.userId.telegramId,
        "⏳ To'lovingiz tekshirilmoqda. Iltimos kuting."
      ).catch(console.error);
    }

    res.json({ message: 'Receipt uploaded successfully', receipt });
  } catch (err) {
    if (uploadedBlob) await del(uploadedBlob.url).catch(console.error);
    console.error('Receipt upload failed:', err);
    res.status(500).json({ error: 'Chekni yuklashda xatolik yuz berdi' });
  }
});

router.get('/admin', async (req, res) => {
  try {
    res.json(await getReceipts());
  } catch (err) {
    console.error('Receipt list failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/admin/:id/verify', async (req, res) => {
  try {
    const { status, message } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const receipt = await getReceipt(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Not found' });

    receipt.status = status;
    receipt.updatedAt = new Date().toISOString();
    await saveReceipt(receipt);

    const bot = getBotInstance();
    const telegramId = receipt.userId?.telegramId;

    if (status === 'approved' && telegramId) {
      await saveTelegramUser(telegramId, {
        username: receipt.userId.username || '',
        name: receipt.userId.name || '',
        isPremium: true
      });

      const loginToken = jwt.sign({
        type: 'telegram-link',
        telegramId,
        username: receipt.userId.username || '',
        name: receipt.userId.name || '',
        isPremium: true
      }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?token=${encodeURIComponent(loginToken)}`;

      if (bot) {
        await bot.sendMessage(
          telegramId,
          "✅ To'lovingiz tasdiqlandi. Barcha kurslar ochildi.",
          { reply_markup: { inline_keyboard: [[{ text: 'Kurslarni ochish', url: loginUrl }]] } }
        );
      }
    } else if (status === 'rejected' && bot && telegramId) {
      await bot.sendMessage(
        telegramId,
        `❌ To'lovingiz qabul qilinmadi.\nSabab: ${message || "To'lov ma'lumotlari mos kelmadi"}`
      );
    }

    res.json({ success: true, receipt });
  } catch (err) {
    console.error('Receipt verification failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
