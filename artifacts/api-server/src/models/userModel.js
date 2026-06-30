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
    organizationName: { type: String, alias: 'name' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: exports.ROLES, default: 'sales' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null, alias: 'organization_id' },
    industryId: { type: String, alias: 'industry_id' },
    contactNumber: { type: String, default: '', alias: 'contact_no' },
    userImage: { type: String, default: '', alias: 'user_image' },
    designation: { type: String, default: '' },
    team: { type: String, default: '' },
    branch: { type: String, default: '' },
    branchPermission: { type: [String], default: [] },
    status: { type: String, default: 'active' },
    isActive: { type: Boolean, default: true, alias: 'is_active' },
    reportingTo: { type: String, default: '', alias: 'reporting_to' },
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    needsPasswordChange: { type: Boolean, default: false, alias: 'needs_password_change' },
    deviceId: { type: String, default: '', alias: 'device_id' },
    uid: { type: String, default: '' },
    latestUpdateProfile: { type: Date, default: null },
    activatedAt: { type: Date, default: null, alias: 'activated_at' },
    deactivatedAt: { type: Date, default: null, alias: 'deactivated_at' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, alias: 'created_by' },
  },
  { 
    timestamps: true, 
    minimize: false,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
  },
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
    industryId: u.industryId || u.industry_id,
    industry_id: u.industryId || u.industry_id,
    isActive: u.isActive !== false && u.is_active !== false,
    is_active: u.isActive !== false && u.is_active !== false,
    reportingTo: u.reportingTo || u.reporting_to || '',
    reporting_to: u.reportingTo || u.reporting_to || '',
    fields: u.fields || {},
    needsPasswordChange: !!(u.needsPasswordChange || u.needs_password_change),
    needs_password_change: !!(u.needsPasswordChange || u.needs_password_change),
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
  if (patch.industryId !== undefined || patch.industry_id !== undefined) {
    $set.industryId = patch.industryId !== undefined ? patch.industryId : patch.industry_id;
  }
  if (patch.isActive !== undefined || patch.is_active !== undefined) {
    $set.isActive = !!(patch.isActive !== undefined ? patch.isActive : patch.is_active);
  }
  if (patch.reportingTo !== undefined || patch.reporting_to !== undefined) {
    $set.reportingTo = String(patch.reportingTo !== undefined ? patch.reportingTo : (patch.reporting_to || ''));
  }
  if (patch.fields !== undefined) $set.fields = patch.fields || {};
  // Password change goes through a separate flow (pre-save hook would not run
  // with findByIdAndUpdate). Allow it here only by hashing manually.
  if (patch.password) {
    $set.password = await bcrypt.hash(String(patch.password), 10);
    $set.needsPasswordChange = false;
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
