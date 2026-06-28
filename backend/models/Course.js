const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  slug:        { type: String },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  category:    { type: String, default: 'Разное' },
  priceCents:  { type: Number, default: 12500000 }, // 50 000 UZS in tiyin
  slidesPath:  { type: String, default: '' },
  slidesCount: { type: Number, default: 0 },
  slidesFiles: [{ type: String }],
  difficulty:  { type: String, default: 'O\'rtacha' },
  prepTime:    { type: String, default: '1 soat' },
  ingredients: [{ type: String }],
  instructions:[{ type: String }],
  emoji:       { type: String, default: '🍽️' },
  thumbnailUrl:{ type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);

