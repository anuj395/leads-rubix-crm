const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    link: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Draft'], default: 'Active' },
    organization_id: { type: String, default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

const News = mongoose.model('News', newsSchema, 'news');

exports.News = News;
