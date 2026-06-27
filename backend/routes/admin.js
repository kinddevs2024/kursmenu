const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const DOMPurify = require('isomorphic-dompurify');
const User = require('../models/User');
const Course = require('../models/Course');

// Admin Authentication Middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    
    req.user = decoded;
    next();
  });
}

// 1. Get All Users (Admin only)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin API error (get users):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Toggle User Course Purchase Access (Admin only)
router.post('/users/:id/toggle-purchase', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    user.isPurchased = !user.isPurchased;
    user.purchaseDate = user.isPurchased ? new Date() : null;
    await user.save();

    console.log(`[Admin] User ${user.email || user.telegramId} purchase status toggled to: ${user.isPurchased}`);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Admin API error (toggle purchase):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Create New Course/Dish (Admin only)
router.post('/courses', authenticateAdmin, async (req, res) => {
  const { title, description, category, difficulty, prepTime, ingredients, instructions } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    // Generate unique slug
    let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const count = await Course.countDocuments({ slug: new RegExp(`^${slug}`) });
    if (count > 0) {
      slug = `${slug}-${count + 1}`;
    }

    // Sanitize rich text description using DOMPurify for security
    const sanitizedDescription = DOMPurify.sanitize(description || '');

    const course = new Course({
      slug,
      title: DOMPurify.sanitize(title),
      description: sanitizedDescription,
      category: DOMPurify.sanitize(category || 'General'),
      difficulty: DOMPurify.sanitize(difficulty || 'Medium'),
      prepTime: DOMPurify.sanitize(prepTime || '1 hour'),
      ingredients: (ingredients || []).map(i => DOMPurify.sanitize(i)),
      instructions: (instructions || []).map(i => DOMPurify.sanitize(i)),
      slidesCount: 10 // Default mock slides count for admin-created dishes
    });

    await course.save();
    console.log(`[Admin] Created new course: ${course.title} (slug: ${course.slug})`);
    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error('Admin API error (create course):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Update Existing Course/Dish (Admin only)
router.put('/courses/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, category, difficulty, prepTime, ingredients, instructions } = req.body;

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Sanitize inputs using DOMPurify
    if (title) course.title = DOMPurify.sanitize(title);
    if (description !== undefined) course.description = DOMPurify.sanitize(description);
    if (category) course.category = DOMPurify.sanitize(category);
    if (difficulty) course.difficulty = DOMPurify.sanitize(difficulty);
    if (prepTime) course.prepTime = DOMPurify.sanitize(prepTime);
    if (ingredients) course.ingredients = ingredients.map(i => DOMPurify.sanitize(i));
    if (instructions) course.instructions = instructions.map(i => DOMPurify.sanitize(i));

    await course.save();
    console.log(`[Admin] Updated course: ${course.title}`);
    res.json({ success: true, course });
  } catch (error) {
    console.error('Admin API error (update course):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Delete Course/Dish (Admin only)
router.delete('/courses/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Course.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: 'Course not found' });
    }
    console.log(`[Admin] Deleted course ID: ${id}`);
    res.json({ success: true, message: 'Блюдо успешно удалено из курса' });
  } catch (error) {
    console.error('Admin API error (delete course):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
