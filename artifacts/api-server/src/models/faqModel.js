const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Draft'], default: 'Active' },
    videoUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

const FAQ = mongoose.model('FAQ', faqSchema, 'faqs');

exports.FAQ = FAQ;
