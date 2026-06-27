const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  slug:        { type: String },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  category:    { type: String, default: 'Разное' },
  priceCents:  { type: Number, default: 5000000 }, // 50 000 UZS in tiyin
  slidesPath:  { type: String, default: '' },
  slidesCount: { type: Number, default: 0 },
  difficulty:  { type: String, default: 'Medium' },
  prepTime:    { type: String, default: '1 час' },
  ingredients: [{ type: String }],
  instructions:[{ type: String }],
  emoji:       { type: String, default: '🍽️' },
  thumbnailUrl:{ type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);

