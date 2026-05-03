// src/models/userModel.js
// mongoose-based user model implementation.
// Core auth fields are strict (email, password, role); freeform per-role
// dynamic fields live under `fields` (Mixed) so the SuperAdmin can attach
// any custom attributes configured through the screen-config system without
// schema migrations.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Predefined roles (machine-friendly keys)
exports.ROLES = ['sales', 'teamLead', 'leadManager', 'admin', 'superAdmin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: exports.ROLES, default: 'sales' },
    industry_id: { type: String },
    is_active: { type: Boolean, default: true },
    // Per-role custom attributes resolved through the `users` screen config.
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

// hash password before save
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);
exports.User = User;

function shapePublic(u) {
  if (!u) return null;
  return {
    _id: u._id,
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    industry_id: u.industry_id,
    is_active: u.is_active !== false,
    fields: u.fields || {},
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}
exports.shapePublic = shapePublic;

exports.findAll = async () => {
  const list = await User.find().select('-password').lean().exec();
  return list.map(shapePublic);
};

exports.list = async ({ industry_id } = {}) => {
  const q = {};
  if (industry_id) q.industry_id = industry_id;
  const list = await User.find(q).select('-password').sort({ createdAt: -1 }).lean().exec();
  return list.map(shapePublic);
};

/**
 * Paged list with optional `q` (matches name/email, case-insensitive) and
 * `sort` (`{ field: 1|-1 }`). Returns `{ items, total }` so the DataGrid can
 * drive server-side pagination.
 */
exports.listPaged = async ({
  industry_id,
  q: search,
  page = 0,
  pageSize = 25,
  sort,
} = {}) => {
  const filter = {};
  if (industry_id) filter.industry_id = industry_id;
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    filter.$or = [{ email: rx }, { name: rx }];
  }
  const sortSpec = sort && Object.keys(sort).length ? sort : { createdAt: -1 };
  const safePage = Math.max(0, Number(page) || 0);
  const safeSize = Math.min(200, Math.max(1, Number(pageSize) || 25));

  const [list, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort(sortSpec)
      .skip(safePage * safeSize)
      .limit(safeSize)
      .lean()
      .exec(),
    User.countDocuments(filter).exec(),
  ]);
  return { items: list.map(shapePublic), total };
};

exports.findById = async (id) => {
  const u = await User.findById(id).select('-password').lean().exec();
  return shapePublic(u);
};

exports.findByEmail = async (email) => {
  return User.findOne({ email: String(email).toLowerCase().trim() }).exec();
};

exports.create = async (data) => {
  const user = new User(data);
  await user.save();
  return shapePublic(user.toObject());
};

exports.update = async (id, patch) => {
  const $set = {};
  if (patch.name !== undefined) $set.name = patch.name;
  if (patch.role !== undefined) $set.role = patch.role;
  if (patch.industry_id !== undefined) $set.industry_id = patch.industry_id;
  if (patch.is_active !== undefined) $set.is_active = !!patch.is_active;
  if (patch.fields !== undefined) $set.fields = patch.fields || {};
  // Password change goes through a separate flow (pre-save hook would not run
  // with findByIdAndUpdate). Allow it here only by hashing manually.
  if (patch.password) {
    $set.password = await bcrypt.hash(String(patch.password), 10);
  }
  const updated = await User.findByIdAndUpdate(id, { $set }, { new: true })
    .select('-password')
    .lean()
    .exec();
  return shapePublic(updated);
};

exports.remove = async (id) => {
  await User.findByIdAndDelete(id).exec();
};
