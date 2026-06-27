const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const path = require('path');
const mongoose = require('mongoose');
const { findFallbackCourse, getFallbackCourses, slidesFullPath } = require('../fallbackCourses');

function isMongoReady() {
  return Course.db.readyState === 1;
}

async function findCourse(id) {
  if (isMongoReady() && mongoose.Types.ObjectId.isValid(id)) {
    const course = await Course.findById(id);
    if (course) return course;
  }

  return findFallbackCourse(id);
}

function sendPlaceholderSlide(res, filename, title = 'Course') {
  const slideNum = filename.replace(/[^\d]/g, '') || '1';
  const safeTitle = String(title).replace(/[<>&'"]/g, '');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="650" viewBox="0 0 1000 650">
      <rect width="100%" height="100%" fill="#fbf7ef"/>
      <rect x="64" y="64" width="872" height="522" rx="28" fill="#fff" stroke="#eadfcd"/>
      <text x="500" y="265" fill="#8b1a2a" font-size="72" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle">Slide ${slideNum}</text>
      <text x="500" y="335" fill="#2b2017" font-size="34" font-family="Arial, sans-serif" text-anchor="middle">${safeTitle}</text>
      <text x="500" y="395" fill="#7b6f63" font-size="22" font-family="Arial, sans-serif" text-anchor="middle">Course material preview</text>
    </svg>
  `);
}

// GET /api/courses - list all courses
router.get('/', async (req, res) => {
  try {
    if (isMongoReady()) {
      const courses = await Course.find();
      if (courses.length > 0) {
        return res.json(courses);
      }
    }

    res.json(getFallbackCourses());
  } catch (err) {
    console.error(err);
    res.json(getFallbackCourses());
  }
});

// GET /api/courses/:id - get single course details
router.get('/:id', async (req, res) => {
  try {
    const course = await findCourse(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET /api/courses/:id/slides - list slide filenames
router.get('/:id/slides', async (req, res) => {
  try {
    const course = await findCourse(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    // For Vercel Serverless compatibility, we generate the array based on slidesCount
    // because reading the 1.2GB directory is not possible in a 250MB serverless function.
    const count = course.slidesCount || 10;
    const files = [];
    for (let i = 1; i <= count; i++) {
      const num = i.toString().padStart(2, '0');
      files.push(`slide-${num}.png`);
    }
    
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Serve slide images for a course
router.get('/:id/slides/:filename', async (req, res) => {
  try {
    const course = await findCourse(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const filename = req.params.filename;
    const filePath = path.join(slidesFullPath, course.slug || req.params.id, filename);
    
    res.sendFile(filePath, err => {
      if (err) {
        sendPlaceholderSlide(res, filename, course.title);
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
