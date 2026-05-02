const mongoose = require('mongoose');

const screenPermissionSchema = new mongoose.Schema(
  {
    screen_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    industry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry', required: true },
    field_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenField', required: true },
    is_enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

screenPermissionSchema.index(
  { screen_id: 1, role_id: 1, industry_id: 1, field_id: 1 },
  { unique: true, name: 'idx_screen_perm_unique' },
);
screenPermissionSchema.index(
  { screen_id: 1, role_id: 1, industry_id: 1, is_enabled: 1 },
  { name: 'idx_screen_perm_lookup' },
);

const ScreenPermission = mongoose.model(
  'ScreenPermission',
  screenPermissionSchema,
  'screen_permissions',
);

exports.ScreenPermission = ScreenPermission;

exports.list = async ({ screen_id, role_id, industry_id, field_id, enabledOnly = false } = {}) => {
  const q = {};
  if (screen_id) q.screen_id = screen_id;
  if (role_id) q.role_id = role_id;
  if (industry_id) q.industry_id = industry_id;
  if (field_id) q.field_id = field_id;
  if (enabledOnly) q.is_enabled = true;
  return ScreenPermission.find(q).lean().exec();
};

exports.findById = async (id) => ScreenPermission.findById(id).lean().exec();

exports.upsert = async ({ screen_id, role_id, industry_id, field_id, is_enabled }) => {
  const $set = {};
  if (is_enabled !== undefined) $set.is_enabled = !!is_enabled;
  await ScreenPermission.updateOne(
    { screen_id, role_id, industry_id, field_id },
    { $set, $setOnInsert: { screen_id, role_id, industry_id, field_id } },
    { upsert: true },
  );
  return ScreenPermission.findOne({ screen_id, role_id, industry_id, field_id }).lean().exec();
};

exports.remove = async (id) => ScreenPermission.findByIdAndDelete(id).lean().exec();

exports.removeByScreen = async (screen_id) =>
  ScreenPermission.deleteMany({ screen_id }).exec();

exports.removeByRole = async (role_id) =>
  ScreenPermission.deleteMany({ role_id }).exec();

exports.removeByIndustry = async (industry_id) =>
  ScreenPermission.deleteMany({ industry_id }).exec();

exports.removeByField = async (field_id) =>
  ScreenPermission.deleteMany({ field_id }).exec();

// Overwrite enabled fields for a (screen, role, industry) combo. Anything not
// in `field_ids` becomes disabled (deleted); listed ids become enabled (upsert).
exports.bulkSetForCombo = async ({ screen_id, role_id, industry_id, field_ids }) => {
  const ids = Array.isArray(field_ids) ? field_ids : [];
  await ScreenPermission.deleteMany({
    screen_id,
    role_id,
    industry_id,
    field_id: { $nin: ids },
  });
  if (ids.length) {
    const ops = ids.map((field_id) => ({
      updateOne: {
        filter: { screen_id, role_id, industry_id, field_id },
        update: {
          $set: { is_enabled: true },
          $setOnInsert: { screen_id, role_id, industry_id, field_id },
        },
        upsert: true,
      },
    }));
    await ScreenPermission.bulkWrite(ops, { ordered: false });
  }
  return ScreenPermission.find({ screen_id, role_id, industry_id }).lean().exec();
};
