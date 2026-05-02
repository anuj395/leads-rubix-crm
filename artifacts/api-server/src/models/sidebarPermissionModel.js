const mongoose = require('mongoose');

const sidebarPermissionSchema = new mongoose.Schema(
  {
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    industry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry', required: true },
    menu_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SidebarMenu', required: true },
    is_visible: { type: Boolean, default: true },
    order_override: { type: Number, default: null },
  },
  { timestamps: true },
);

sidebarPermissionSchema.index(
  { role_id: 1, industry_id: 1, menu_id: 1 },
  { unique: true, name: 'idx_perm_unique' },
);
sidebarPermissionSchema.index(
  { role_id: 1, industry_id: 1, is_visible: 1 },
  { name: 'idx_perm_lookup' },
);

const SidebarPermission = mongoose.model(
  'SidebarPermission',
  sidebarPermissionSchema,
  'sidebar_permissions',
);

exports.SidebarPermission = SidebarPermission;

exports.list = async ({ role_id, industry_id, menu_id, visibleOnly = false } = {}) => {
  const q = {};
  if (role_id) q.role_id = role_id;
  if (industry_id) q.industry_id = industry_id;
  if (menu_id) q.menu_id = menu_id;
  if (visibleOnly) q.is_visible = true;
  return SidebarPermission.find(q).lean().exec();
};

exports.findById = async (id) => SidebarPermission.findById(id).lean().exec();

exports.upsert = async ({ role_id, industry_id, menu_id, is_visible, order_override }) => {
  const $set = {};
  if (is_visible !== undefined) $set.is_visible = !!is_visible;
  if (order_override !== undefined) {
    $set.order_override = order_override === null ? null : Number(order_override);
  }
  await SidebarPermission.updateOne(
    { role_id, industry_id, menu_id },
    { $set, $setOnInsert: { role_id, industry_id, menu_id } },
    { upsert: true },
  );
  return SidebarPermission.findOne({ role_id, industry_id, menu_id }).lean().exec();
};

exports.remove = async (id) => SidebarPermission.findByIdAndDelete(id).lean().exec();

exports.removeByCombo = async ({ role_id, industry_id, menu_id }) =>
  SidebarPermission.deleteOne({ role_id, industry_id, menu_id }).exec();

exports.removeByRoleIndustry = async ({ role_id, industry_id }) =>
  SidebarPermission.deleteMany({ role_id, industry_id }).exec();

exports.removeByIndustry = async (industry_id) =>
  SidebarPermission.deleteMany({ industry_id }).exec();

exports.removeByRole = async (role_id) =>
  SidebarPermission.deleteMany({ role_id }).exec();

exports.removeByMenu = async (menu_id) =>
  SidebarPermission.deleteMany({ menu_id }).exec();

exports.bulkSetForRoleIndustry = async ({ role_id, industry_id, menu_ids }) => {
  const ids = Array.isArray(menu_ids) ? menu_ids : [];
  await SidebarPermission.deleteMany({
    role_id,
    industry_id,
    menu_id: { $nin: ids },
  });
  if (ids.length) {
    const ops = ids.map((menu_id) => ({
      updateOne: {
        filter: { role_id, industry_id, menu_id },
        update: {
          $set: { is_visible: true },
          $setOnInsert: { role_id, industry_id, menu_id },
        },
        upsert: true,
      },
    }));
    await SidebarPermission.bulkWrite(ops, { ordered: false });
  }
  return SidebarPermission.find({ role_id, industry_id }).lean().exec();
};
