const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
    status: { type: String, enum: ['Launched', 'Pre-Launched', 'Pending'], default: 'Launched' },
  },
  { timestamps: true },
);

industrySchema.index({ code: 1 }, { unique: true, name: 'idx_industry_code' });

const Industry = mongoose.model('Industry', industrySchema, 'industries');

exports.Industry = Industry;

exports.list = async ({ activeOnly = false } = {}) => {
  const q = { status: 'Launched' };
  if (activeOnly) {
    q.is_active = true;
  }
  return Industry.find(q).sort({ code: 1 }).lean().exec();
};

exports.findById = async (id) => Industry.findById(id).lean().exec();

exports.findByCode = async (code) => {
  if (!code) return null;
  const lower = String(code).toLowerCase().trim();
  let doc = await Industry.findOne({ code: lower }).lean().exec();
  if (!doc && mongoose.Types.ObjectId.isValid(code)) {
    doc = await Industry.findById(code).lean().exec();
  }
  return doc;
};

exports.create = async ({ code, name, description, is_active, status }) => {
  const doc = await Industry.create({
    code: String(code).toLowerCase().trim(),
    name: String(name).trim(),
    description: description || '',
    is_active: is_active !== false,
    status: status || 'Launched',
  });
  return doc.toObject();
};

exports.update = async (id, patch) => {
  const update = {};
  if (patch.code !== undefined) update.code = String(patch.code).toLowerCase().trim();
  if (patch.name !== undefined) update.name = String(patch.name).trim();
  if (patch.description !== undefined) update.description = String(patch.description);
  if (patch.is_active !== undefined) update.is_active = !!patch.is_active;
  if (patch.status !== undefined) update.status = String(patch.status);
  return Industry.findByIdAndUpdate(id, { $set: update }, { new: true }).lean().exec();
};

exports.remove = async (id) => Industry.findByIdAndDelete(id).lean().exec();
