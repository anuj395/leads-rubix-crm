const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Draft'], default: 'Active' },
    videoUrl: { type: String, default: '' },
    organization_id: { type: String, default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

const FAQ = mongoose.model('FAQ', faqSchema, 'faqs');

exports.FAQ = FAQ;
