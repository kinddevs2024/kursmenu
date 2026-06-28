const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const slidesDirSetting = process.env.SLIDES_DIR || '../generated-slides';
const slidesFullPath = path.resolve(__dirname, slidesDirSetting);
const DEFAULT_SLUGS = [
  'baileys-choux-pastries-generated',
  'birds-milk-cake-generated',
  'black-forest-cake-direct',
  'blackcurrant-chocolate-cake-direct',
  'chocolate-blackcurrant-cake',
  'chocolate-chocolate-cake-direct',
  'chocolate-eclairs-generated',
  'chocolate-madness-cheesecake-zara-generated',
  'cold-cherry-cheesecake-zara-generated',
  'cranberry-mascarpone-cake-direct',
  'custard-crepe-cake-direct',
  'custard-rings-curd-cream-generated',
  'honey-cake-atelier-direct',
  'lemon-glazed-cakes-generated',
  'lemon-meringue-tartlets-generated',
  'mousse-chocolate-passionfruit-generated',
  'napoleon-plombir-cake-generated',
  'new-york-cheesecake-zara-generated',
  'nut-caramel-tartlets-generated',
  'orange-cream-tart-generated',
  'penechki-pastries-generated 1',
  'royal-vatrushka-zara-generated',
  'strawberry-custard-tart-generated',
  'three-chocolates-cake-direct 1',
  'tiramisu-cheesecake-zara-generated',
  'triple-chocolate-cheesecake-zara-generated',
  'whoopie-pie-cream-generated',
  'yumbriki-generated',
];

function stableId(slug) {
  return crypto.createHash('md5').update(slug).digest('hex').slice(0, 24);
}

function toTitle(slug) {
  return slug
    .replace(/\b(generated|direct|zara|atelier)\b/gi, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+\d+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function countSlides(dirPath) {
  try {
    return fs.readdirSync(dirPath).filter((file) => /^slide-\d+\.png$/i.test(file)).length;
  } catch {
    return 10;
  }
}

function categoryFor(slug) {
  if (/cheesecake/i.test(slug)) return 'Cheesecakes';
  if (/tart/i.test(slug)) return 'Tarts';
  if (/pastr|eclair|yumbriki|whoopie/i.test(slug)) return 'Pastries';
  return 'Cakes';
}

function difficultyFor(slug) {
  if (/eclair|mousse|choux/i.test(slug)) return 'Hard';
  if (/yumbriki|whoopie/i.test(slug)) return 'Easy';
  return 'Medium';
}

function buildCourse(slug, dirPath) {
  const title = toTitle(slug) || 'Pastry Course';
  const difficulty = difficultyFor(slug);

  return {
    _id: stableId(slug),
    slug,
    title,
    description: `Step-by-step pastry course for ${title.toLowerCase()}.`,
    category: categoryFor(slug),
    priceCents: 12500000,
    slidesPath: slug,
    slidesCount: countSlides(dirPath),
    difficulty,
    prepTime: difficulty === 'Easy' ? '45 min' : difficulty === 'Medium' ? '1.5 hours' : '3 hours',
    ingredients: ['Flour', 'Butter', 'Sugar', 'Cream', 'Eggs'],
    instructions: [
      'Prepare and weigh all ingredients.',
      'Make the base mixture.',
      'Bake at the required temperature.',
      'Prepare the cream or filling.',
      'Assemble and chill before serving.',
    ],
    emoji: '🍰',
    thumbnailUrl: '',
  };
}

function getFallbackCourses() {
  if (!fs.existsSync(slidesFullPath)) {
    return DEFAULT_SLUGS.map((slug) => buildCourse(slug, path.join(slidesFullPath, slug)));
  }

  const localSlugs = fs.readdirSync(slidesFullPath)
    .filter((file) => {
      const fullPath = path.join(slidesFullPath, file);
      return fs.statSync(fullPath).isDirectory() && !/wrong-overlay-do-not-use/i.test(file);
    });
  const slugs = localSlugs.length > 0 ? localSlugs : DEFAULT_SLUGS;

  return slugs.map((slug) => buildCourse(slug, path.join(slidesFullPath, slug)));
}

function findFallbackCourse(idOrSlug) {
  return getFallbackCourses().find((course) => (
    course._id === idOrSlug || course.slug === idOrSlug
  ));
}

module.exports = {
  findFallbackCourse,
  getFallbackCourses,
  slidesFullPath,
};
