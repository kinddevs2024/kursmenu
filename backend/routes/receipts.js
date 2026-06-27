const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Receipt = require('../models/Receipt');
const User = require('../models/User');
const { getBotInstance } = require('../bot');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/upload', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const courseId = req.body.courseId;
    const receiptUrl = `/uploads/${req.file.filename}`;

    const receipt = new Receipt({
      userId: req.user.sub,
      courseId,
      receiptUrl,
      status: 'pending'
    });
    
    await receipt.save();
    res.json({ message: 'Receipt uploaded successfully', receipt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/admin', async (req, res) => {
  // We can add an isAdmin check, but for now assuming the frontend knows
  try {
    const receipts = await Receipt.find().populate('userId').sort({ createdAt: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/admin/:id/verify', async (req, res) => {
  try {
    const { status, message } = req.body;
    const receipt = await Receipt.findById(req.params.id).populate('userId');
    if (!receipt) return res.status(404).json({ error: 'Not found' });

    receipt.status = status;
    await receipt.save();

    const bot = getBotInstance();

    if (status === 'approved') {
      await User.findByIdAndUpdate(receipt.userId._id, { isPremium: true });
      
      if (bot) {
        bot.sendMessage(
          receipt.userId.telegramId,
          `✅ Sizning to'lovingiz tasdiqlandi! Barcha kurslar endi ochiq. Yaxshi o'rganishlar!`
        ).catch(e => console.error(e));
      }
    } else if (status === 'rejected') {
      if (bot) {
        bot.sendMessage(
          receipt.userId.telegramId,
          `❌ Sizning to'lovingiz qabul qilinmadi.\nSabab: ${message || 'To\'lov summasi kam'}\nIltimos tekshirib qaytadan urinib ko'ring.`
        ).catch(e => console.error(e));
      }
    }

    res.json({ success: true, receipt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
