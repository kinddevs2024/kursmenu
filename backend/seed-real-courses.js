require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Course = require('./models/Course'); // Make sure this path is correct

const slidesDir = path.join(__dirname, '..', 'generated-slides');

// Helper to convert folder name to readable title
function formatTitle(slug) {
  // Remove trailing -generated or -direct
  let clean = slug.replace(/-generated$/, '').replace(/-direct$/, '').replace(/-\d+$/, '');
  // Replace dashes with spaces and title case
  return clean.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edmission');
    console.log('Connected.');

    console.log('Clearing old courses...');
    await Course.deleteMany({});
    console.log('Old courses cleared.');

    if (!fs.existsSync(slidesDir)) {
      console.error(`Slides directory not found at ${slidesDir}`);
      process.exit(1);
    }

    const folders = fs.readdirSync(slidesDir).filter(f => {
      return fs.statSync(path.join(slidesDir, f)).isDirectory();
    });

    console.log(`Found ${folders.length} course folders.`);

    const coursesToInsert = [];

    for (const folder of folders) {
      const folderPath = path.join(slidesDir, folder);
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
      
      const title = formatTitle(folder);

      coursesToInsert.push({
        slug: folder,
        title: title,
        description: `Professional oshpaz ko'rsatmalari bilan ${title} tayyorlashni o'rganing.`,
        category: 'Desertlar',
        priceCents: 12500000,
        slidesCount: files.length,
        difficulty: 'Medium',
        prepTime: '45 daqiqa',
        emoji: '🍰'
      });
    }

    if (coursesToInsert.length > 0) {
      await Course.insertMany(coursesToInsert);
      console.log(`Successfully inserted ${coursesToInsert.length} courses!`);
    } else {
      console.log('No courses found to insert.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
