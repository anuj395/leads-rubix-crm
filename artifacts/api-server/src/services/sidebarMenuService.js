const menuModel = require('../models/sidebarMenuModel');
const permissionModel = require('../models/sidebarPermissionModel');

exports.list = (opts) => menuModel.list(opts);

exports.get = async (id) => {
  const doc = await menuModel.findById(id);
  if (!doc) {
    const err = new Error('Menu not found');
    err.status = 404;
    throw err;
  }
  return doc;
};

exports.create = async (payload) => {
  if (!payload?.key || !payload?.name) {
    const err = new Error('key and name are required');
    err.status = 400;
    throw err;
  }
  const dup = await menuModel.findByKey(payload.key);
  if (dup) {
    const err = new Error('Menu with this key already exists');
    err.status = 409;
    throw err;
  }
  if (payload.parent_id) {
    const parent = await menuModel.findById(payload.parent_id);
    if (!parent) {
      const err = new Error('Parent menu not found');
      err.status = 404;
      throw err;
    }
  }
  return menuModel.create(payload);
};

exports.update = async (id, patch) => {
  if (patch?.key) {
    const dup = await menuModel.findByKey(patch.key);
    if (dup && String(dup._id) !== String(id)) {
      const err = new Error('Menu with this key already exists');
      err.status = 409;
      throw err;
    }
  }
  if (patch?.parent_id && String(patch.parent_id) === String(id)) {
    const err = new Error('Menu cannot be its own parent');
    err.status = 400;
    throw err;
  }
  const doc = await menuModel.update(id, patch || {});
  if (!doc) {
    const err = new Error('Menu not found');
    err.status = 404;
    throw err;
  }
  return doc;
};

// Cascade: deleting a menu also removes any permission rows referencing it,
// and detaches its direct children (parent_id → null) so they aren't orphaned
// and pointing at a missing record.
exports.remove = async (id) => {
  const doc = await menuModel.findById(id);
  if (!doc) {
    const err = new Error('Menu not found');
    err.status = 404;
    throw err;
  }

  // Detach children (best-effort; if model exposes deleteMany, we still leave
  // children in place but with parent_id=null so they remain visible).
  const children = await menuModel.list({ parent_id: id });
  for (const child of children) {
    // eslint-disable-next-line no-await-in-loop
    await menuModel.update(child._id, { parent_id: null });
  }

  // Remove permissions that reference this menu.
  if (typeof permissionModel.removeByMenu === 'function') {
    await permissionModel.removeByMenu(id);
  } else if (typeof permissionModel.deleteMany === 'function') {
    await permissionModel.deleteMany({ menu_id: id });
  }

  await menuModel.remove(id);
  return doc;
};
