require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Course = require('./models/Course');

const slidesFullPath = path.join(__dirname, '..', 'generated-slides');

const slugify = (text) => {
  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '', 'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': 'o', 'ғ': 'g', 'қ': 'q', 'ҳ': 'h', ' ': '-'
  };
  
  let str = text.toLowerCase();
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    res += ru[char] !== undefined ? ru[char] : char;
  }
  
  return res
    .replace(/[^a-z0-9\-]+/g, '')
    .replace(/(^-|-$)+/g, '')
    .replace(/-+/g, '-');
};

const determineCategory = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('tort') || lower.includes('cake') || lower.includes('medovik') || lower.includes('napoleon')) return 'Tortlar';
  if (lower.includes('cheesecake') || lower.includes('chizkeyk')) return 'Chizkeyklar';
  if (lower.includes('tart') || lower.includes('tartletka')) return 'Tart va Tartletkalar';
  if (lower.includes('pechenye') || lower.includes('cookie') || lower.includes('brauni') || lower.includes('trufellar')) return 'Shirinliklar';
  if (lower.includes('muss') || lower.includes('mousse') || lower.includes('tiramisu')) return 'Desertlar';
  return 'Pishiriqlar';
};

const determineDifficulty = (category) => {
  if (category === 'Tortlar' || category === 'Chizkeyklar') return 'Murakkab';
  if (category === 'Tart va Tartletkalar') return 'O\'rtacha';
  return 'Oson';
};

const determinePrepTime = (difficulty) => {
  if (difficulty === 'Oson') return '45 daqiqa';
  if (difficulty === 'O\'rtacha') return '1 soat 30 daqiqa';
  return '3 soat';
};

async function seedUzbek() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // 1. Delete all existing courses to avoid duplicates
    await Course.deleteMany({});
    console.log('🗑️ Cleared existing courses');

    const dirs = fs.readdirSync(slidesFullPath).filter(file => {
      return fs.statSync(path.join(slidesFullPath, file)).isDirectory() && file !== 'mock-slides';
    });

    console.log(`📂 Found ${dirs.length} course folders`);

    const dishes = [];

    dirs.forEach(dir => {
      // Process title
      let rawTitle = dir
        .replace(/[-_]+/g, ' ')
        .replace(/\b(generated|direct)\b/gi, '')
        .trim();

      // Remove emojis from the name (if we want a clean name for slug/DB)
      const cleanTitle = rawTitle.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
      
      const titleParts = cleanTitle.split(' ');
      const title = titleParts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

      const slug = slugify(title) || slugify(dir);

      // Process slides
      const dirPath = path.join(slidesFullPath, dir);
      const allFiles = fs.readdirSync(dirPath);
      
      // Filter out contact-sheet, thumbnail, or non-images
      const slidesFiles = allFiles.filter(f => {
        const isImage = f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp');
        const isExcluded = f.includes('contact') || f.includes('thumbnail') || f.includes('sheet');
        return isImage && !isExcluded;
      }).sort((a, b) => {
        // Natural sort: "slide-2" comes before "slide-10"
        return a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'});
      });

      if (slidesFiles.length === 0) return; // Skip if no slides

      const category = determineCategory(title);
      const difficulty = determineDifficulty(category);
      const prepTime = determinePrepTime(difficulty);

      dishes.push({
        slug: slug,
        title: title,
        description: `Ushbu professional bosqichma-bosqich kurs orqali siz mukammal "${title}" tayyorlashni o'rganasiz. Barcha sirlar, texnikalar va retsept batafsil ko'rsatilgan.`,
        category: category,
        slidesPath: dir, // We save the original folder name to build the URL later
        slidesFiles: slidesFiles,
        slidesCount: slidesFiles.length,
        difficulty: difficulty,
        prepTime: prepTime,
        ingredients: [
          'Oliy navli un',
          'Sariyog\' 82.5%',
          'Shakar kukuni',
          'Tuxum',
          'Qaymoq 33%'
        ],
        instructions: [
          'Barcha masalliqlarni tayyorlash va o\'lchash.',
          'Asosni tayyorlash.',
          'Krem yoki nachinkani tayyorlash.',
          'Shirinlikni yig\'ish va muzlatgichda qoldirish.',
          'Bezatish va chiroyli taqdim etish.'
        ],
        priceCents: 12500000 // 50 000 UZS
      });
    });

    await Course.insertMany(dishes);
    console.log(`🎉 Successfully seeded ${dishes.length} courses!`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedUzbek();
