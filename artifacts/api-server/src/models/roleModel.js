const mongoose = require('mongoose');

const ROLE_KEYS = ['superAdmin', 'admin', 'leadManager', 'teamLead', 'sales'];

const roleSchema = new mongoose.Schema(
  {
    industry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry', required: true },
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

roleSchema.index({ industry_id: 1, key: 1 }, { unique: true, name: 'idx_role_industry_key' });

const Role = mongoose.model('Role', roleSchema, 'roles');

exports.Role = Role;
exports.ROLE_KEYS = ROLE_KEYS;

exports.list = async ({ industry_id, activeOnly = false } = {}) => {
  const q = {};
  if (industry_id) q.industry_id = industry_id;
  if (activeOnly) q.is_active = true;
  return Role.find(q).sort({ key: 1 }).lean().exec();
};

exports.findById = async (id) => Role.findById(id).lean().exec();

exports.findByIndustryAndKey = async (industry_id, key) =>
  Role.findOne({ industry_id, key: String(key).trim() }).lean().exec();

exports.create = async ({ industry_id, key, name, description, is_active }) => {
  const doc = await Role.create({
    industry_id,
    key: String(key).trim(),
    name: String(name).trim(),
    description: description || '',
    is_active: is_active !== false,
  });
  return doc.toObject();
};

exports.update = async (id, patch) => {
  const update = {};
  if (patch.key !== undefined) update.key = String(patch.key).trim();
  if (patch.name !== undefined) update.name = String(patch.name).trim();
  if (patch.description !== undefined) update.description = String(patch.description);
  if (patch.is_active !== undefined) update.is_active = !!patch.is_active;
  if (patch.industry_id !== undefined) update.industry_id = patch.industry_id;
  return Role.findByIdAndUpdate(id, { $set: update }, { new: true }).lean().exec();
};

exports.remove = async (id) => Role.findByIdAndDelete(id).lean().exec();
