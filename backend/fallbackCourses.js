const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const COURSE_MANIFEST = require('./courseManifest.json');

const slidesDirSetting = process.env.SLIDES_DIR || '../generated-slides';
const slidesFullPath = path.resolve(__dirname, slidesDirSetting);
const MANIFEST_BY_SLUG = new Map(COURSE_MANIFEST.map((course) => [course.slug, course]));
const DEFAULT_SLUGS = COURSE_MANIFEST.map((course) => course.slug);

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

function listSlideFiles(dirPath) {
  try {
    return fs.readdirSync(dirPath)
      .filter((file) => /^slide-\d+\.(png|webp|jpe?g)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  } catch {
    return [];
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
  const localSlideFiles = listSlideFiles(dirPath);
  const slidesFiles = localSlideFiles.length > 0
    ? localSlideFiles
    : (MANIFEST_BY_SLUG.get(slug)?.slidesFiles || []);

  return {
    _id: stableId(slug),
    slug,
    title,
    description: `Step-by-step pastry course for ${title.toLowerCase()}.`,
    category: categoryFor(slug),
    priceCents: 12500000,
    slidesPath: slug,
    slidesCount: slidesFiles.length || 10,
    slidesFiles,
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
  const localSlugs = fs.existsSync(slidesFullPath)
    ? fs.readdirSync(slidesFullPath).filter((file) => {
      const fullPath = path.join(slidesFullPath, file);
      return fs.statSync(fullPath).isDirectory() && !/wrong-overlay-do-not-use/i.test(file);
    })
    : [];
  const slugs = [...new Set([...DEFAULT_SLUGS, ...localSlugs])];

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
