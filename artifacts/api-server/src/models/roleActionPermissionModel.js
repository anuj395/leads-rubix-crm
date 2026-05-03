const mongoose = require('mongoose');

/**
 * One row per (role, industry, screen) granting any subset of the four basic
 * actions. SuperAdmin and admin roles are treated as implicit allow at the
 * service layer — no row required.
 */
const roleActionPermissionSchema = new mongoose.Schema(
  {
    role_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Role',     required: true },
    industry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry', required: true },
    screen_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Screen',   required: true },
    can_view:    { type: Boolean, default: false },
    can_add:     { type: Boolean, default: false },
    can_edit:    { type: Boolean, default: false },
    can_delete:  { type: Boolean, default: false },
  },
  { timestamps: true },
);

roleActionPermissionSchema.index(
  { role_id: 1, industry_id: 1, screen_id: 1 },
  { unique: true, name: 'idx_role_action_perm_unique' },
);

const RoleActionPermission = mongoose.model(
  'RoleActionPermission',
  roleActionPermissionSchema,
  'role_action_permissions',
);

exports.RoleActionPermission = RoleActionPermission;

exports.list = async ({ role_id, industry_id, screen_id } = {}) => {
  const q = {};
  if (role_id) q.role_id = role_id;
  if (industry_id) q.industry_id = industry_id;
  if (screen_id) q.screen_id = screen_id;
  return RoleActionPermission.find(q).lean().exec();
};

exports.findFor = ({ role_id, industry_id, screen_id }) =>
  RoleActionPermission.findOne({ role_id, industry_id, screen_id }).lean().exec();

exports.upsert = async ({
  role_id, industry_id, screen_id,
  can_view, can_add, can_edit, can_delete,
}) => {
  const $set = {};
  if (can_view   !== undefined) $set.can_view   = !!can_view;
  if (can_add    !== undefined) $set.can_add    = !!can_add;
  if (can_edit   !== undefined) $set.can_edit   = !!can_edit;
  if (can_delete !== undefined) $set.can_delete = !!can_delete;
  await RoleActionPermission.updateOne(
    { role_id, industry_id, screen_id },
    { $set, $setOnInsert: { role_id, industry_id, screen_id } },
    { upsert: true },
  );
  return RoleActionPermission.findOne({ role_id, industry_id, screen_id }).lean().exec();
};

exports.removeByRole     = (role_id)     => RoleActionPermission.deleteMany({ role_id }).exec();
exports.removeByIndustry = (industry_id) => RoleActionPermission.deleteMany({ industry_id }).exec();
exports.removeByScreen   = (screen_id)   => RoleActionPermission.deleteMany({ screen_id }).exec();
