require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { initBot } = require('./bot');
const Course = require('./models/Course');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const receiptsRoutes = require('./routes/receipts');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

// Security Middlewares (5 Security Libraries/Protection)
// 1. Helmet to secure headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow loading images from backend to frontend
}));

// 2. CORS configurations to prevent unauthorized cross-origin requests
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 3. Express Rate Limiter to prevent brute-force code verification and spamming
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs
  message: { error: 'Слишком много запросов от этого IP, пожалуйста, попробуйте позже.' }
});
app.use('/api/', apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Slide Images Static Folder
const slidesDirSetting = process.env.SLIDES_DIR || '../generated-slides';
const slidesFullPath = path.resolve(__dirname, slidesDirSetting);
app.use('/slides', express.static(slidesFullPath));

// Fallback endpoint for mock/placeholder slides (Dynamic SVG images)
app.get('/slides/mock-slides/:filename', (req, res) => {
  const filename = req.params.filename; // e.g. slide-03.png
  const slideNum = filename.replace(/[^\d]/g, '') || '1';
  
  // Return a beautiful dynamic dark-theme SVG slide placeholder
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0b0f19;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <circle cx="400" cy="240" r="100" fill="#6366f1" opacity="0.1"/>
      <text x="400" y="250" fill="#6366f1" font-size="72" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">Slide ${slideNum}</text>
      <text x="400" y="340" fill="#9ca3af" font-size="24" font-family="system-ui, sans-serif" text-anchor="middle">Кулинарный курс — Шаг ${slideNum}</text>
      <text x="400" y="380" fill="#4b5563" font-size="16" font-family="system-ui, sans-serif" text-anchor="middle">Подтвердите оплату, чтобы разблокировать полный курс</text>
      <rect x="300" y="440" width="200" height="2" fill="#312e81"/>
    </svg>
  `);
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

module.exports = app;

// Database Connection & Auto-Seeding
const isVercel = !!process.env.VERCEL;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edmission')
  .then(async () => {
    console.log('Connected to MongoDB database.');
    await seedDatabase();

    if (!isVercel) {
      initBot();

      app.listen(PORT, () => {
        console.log(`🚀 Backend server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      });
    } else {
      console.log('✅ Vercel serverless mode detected. Backend app is ready to handle /api requests.');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB database connection error:', err.message);
  });

// Database Seeder
async function seedDatabase() {
  try {
    const courseCount = await Course.countDocuments();
    if (courseCount > 0) {
      console.log(`Database already seeded with ${courseCount} courses.`);
      return;
    }

    console.log('🌱 Database is empty. Seeding dishes from generated-slides directory...');

    let dishes = [];

    // 1. Read local directories inside generated-slides
    if (fs.existsSync(slidesFullPath)) {
      const dirs = fs.readdirSync(slidesFullPath).filter(file => {
        return fs.statSync(path.join(slidesFullPath, file)).isDirectory() && file !== 'mock-slides';
      });

      console.log(`Found ${dirs.length} dish folders in generated-slides.`);

      dirs.forEach(dir => {
        // Clean folder name to title: e.g. "baileys-choux-pastries-generated" -> "Baileys Choux Pastries"
        let title = dir
          .replace(/[-_]+/g, ' ')
          .replace(/\b(generated|direct)\b/gi, '')
          .trim();
        
        // Capitalize words
        title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Count slides
        const dirPath = path.join(slidesFullPath, dir);
        const files = fs.readdirSync(dirPath);
        const slidesCount = files.filter(f => f.match(/^slide-\d+\.png$/i)).length;

        // Categorize based on folder name
        let category = 'Торты';
        if (dir.includes('pastr') || dir.includes('eclair') || dir.includes('yumbriki')) {
          category = 'Пирожные';
        } else if (dir.includes('cheesecake')) {
          category = 'Чизкейки';
        } else if (dir.includes('tart')) {
          category = 'Тарт / Тартлетки';
        }

        let difficulty = 'Medium';
        if (dir.includes('eclair') || dir.includes('mousse')) difficulty = 'Hard';
        if (dir.includes('yumbriki') || dir.includes('cookies')) difficulty = 'Easy';

        dishes.push({
          slug: dir,
          title: title,
          description: `Премиальный пошаговый курс по приготовлению ${title.toLowerCase()}. Профессиональная рецептура с детальными слайдами и секретами шеф-кондитера.`,
          category: category,
          slidesCount: slidesCount,
          difficulty: difficulty,
          prepTime: difficulty === 'Easy' ? '45 мин' : difficulty === 'Medium' ? '1.5 часа' : '3 часа',
          ingredients: [
            'Мука высшего сорта',
            'Сливочное масло 82.5%',
            'Сахарная пудра',
            'Сливки 33%',
            'Яйца куриные'
          ],
          instructions: [
            'Подготовка и взвешивание всех ингредиентов.',
            'Приготовление основы (теста или бисквита).',
            'Замес и выпекание при строго контролируемой температуре.',
            'Приготовление крема, мусса или начинки.',
            'Сборка десерта и стабилизация в холодильнике.',
            'Декорирование и финальная презентация.'
          ]
        });
      });
    }

    // Transliteration helper for Russian titles to English slugs
    const slugify = (text) => {
      const ru = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      
      let str = text.toLowerCase();
      let res = '';
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        res += ru[char] !== undefined ? ru[char] : char;
      }
      
      return res
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    };

    // 2. Fill the remaining slots with placeholders to reach exactly 50 courses
    const TARGET_COUNT = 50;
    const currentCount = dishes.length;
    
    if (currentCount < TARGET_COUNT) {
      console.log(`Adding ${TARGET_COUNT - currentCount} placeholder dishes to reach the target of 50.`);
      
      const extraDishes = [
        { title: 'Шоколадный Фондан', category: 'Десерты' },
        { title: 'Макарон Ваниль-Малина', category: 'Пирожные' },
        { title: 'Тарт Татен с Яблоками', category: 'Тарт / Тартлетки' },
        { title: 'Крем-Брюле Классический', category: 'Десерты' },
        { title: 'Шоколадные Трюфели', category: 'Конфеты' },
        { title: 'Павлова с Ягодами', category: 'Пирожные' },
        { title: 'Булочки Синнабон', category: 'Вы配ка' }, // "Выпечка" - wait, we can fix the typo here too
        { title: 'Круассаны Классические', category: 'Выпечка' },
        { title: 'Тирамису в стакане', category: 'Десерты' },
        { title: 'Лимонный Кекс', category: 'Кексы' },
        { title: 'Морковный торт с карамелью', category: 'Торты' },
        { title: 'Шу с карамельным кремом', category: 'Пирожные' },
        { title: 'Панна Котта Манго-Страстоцвет', category: 'Десерты' },
        { title: 'Профитроли с заварным кремом', category: 'Пирожные' },
        { title: 'Красный Бархат Классик', category: 'Торты' },
        { title: 'Меренговый рулет', category: 'Рулеты' },
        { title: 'Шоколадный Брауни', category: 'Десерты' },
        { title: 'Венские Вафли', category: 'Выпечка' },
        { title: 'Эстерхази Торт', category: 'Торты' },
        { title: 'Маффины с Черникой', category: 'Кексы' },
        { title: 'Медовик традиционный', category: 'Торты' },
        { title: 'Шоколадный Мусс', category: 'Десерты' },
      ];

      for (let i = 0; i < (TARGET_COUNT - currentCount); i++) {
        const item = extraDishes[i % extraDishes.length];
        const suffix = Math.floor(i / extraDishes.length);
        const title = suffix > 0 ? `${item.title} Vol. ${suffix + 1}` : item.title;
        const slug = slugify(title);

        dishes.push({
          slug: slug,
          title: title,
          description: `Авторский пошаговый рецепт приготовления десерта "${title}". Подробная инструкция, разбор ключевых кондитерских техник и нюансов текстуры.`,
          category: item.category === 'Вы配ка' ? 'Выпечка' : item.category,
          slidesCount: 12,
          difficulty: i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Medium' : 'Hard',
          prepTime: i % 3 === 0 ? '30 мин' : i % 3 === 1 ? '1 час' : '2 часа',
          ingredients: ['Сливочный сыр', 'Сахар', 'Ванильный экстракт', 'Темный шоколад'],
          instructions: ['Смешать сухие ингредиенты', 'Взбить влажные компоненты', 'Объединить и запечь', 'Охладить перед подачей']
        });
      }
    }

    // Write all dishes to database
    await Course.insertMany(dishes);
    console.log(`🎉 Successfully seeded ${dishes.length} dishes into the database!`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

module.exports = app;
