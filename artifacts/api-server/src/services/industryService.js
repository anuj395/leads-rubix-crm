const industryModel = require('../models/industryModel');
const roleModel = require('../models/roleModel');
const permissionModel = require('../models/sidebarPermissionModel');

exports.list = (opts) => industryModel.list(opts);

exports.get = async (id) => {
  const doc = await industryModel.findById(id);
  if (!doc) {
    const err = new Error('Industry not found');
    err.status = 404;
    throw err;
  }
  return doc;
};

exports.create = async (payload) => {
  if (!payload?.code || !payload?.name) {
    const err = new Error('code and name are required');
    err.status = 400;
    throw err;
  }
  const existing = await industryModel.findByCode(payload.code);
  if (existing) {
    const err = new Error('Industry code already exists');
    err.status = 409;
    throw err;
  }
  return industryModel.create(payload);
};

exports.update = async (id, patch) => {
  if (patch?.code) {
    const existing = await industryModel.findByCode(patch.code);
    if (existing && String(existing._id) !== String(id)) {
      const err = new Error('Industry code already exists');
      err.status = 409;
      throw err;
    }
  }
  const doc = await industryModel.update(id, patch || {});
  if (!doc) {
    const err = new Error('Industry not found');
    err.status = 404;
    throw err;
  }
  return doc;
};

// Removing an industry cascades to all its roles and the permission rows
// that reference either the industry or those roles. We do this in best-effort
// sequence rather than a transaction because the in-memory mongo we use in
// development doesn't support multi-doc transactions — but the steps are
// idempotent and order-safe.
exports.remove = async (id) => {
  const doc = await industryModel.findById(id);
  if (!doc) {
    const err = new Error('Industry not found');
    err.status = 404;
    throw err;
  }

  const roles = await roleModel.list({ industry_id: id });
  const roleIds = roles.map((r) => String(r._id));

  // 1. delete every permission row for this industry (covers all roles + menus).
  if (typeof permissionModel.removeByIndustry === 'function') {
    await permissionModel.removeByIndustry(id);
  } else if (typeof permissionModel.deleteMany === 'function') {
    await permissionModel.deleteMany({ industry_id: id });
  } else {
    // Fallback: per-role cleanup
    for (const rid of roleIds) {
      if (typeof permissionModel.removeByRole === 'function') {
        // eslint-disable-next-line no-await-in-loop
        await permissionModel.removeByRole(rid);
      }
    }
  }

  // 2. delete the roles themselves.
  for (const rid of roleIds) {
    // eslint-disable-next-line no-await-in-loop
    await roleModel.remove(rid);
  }

  // 3. finally remove the industry.
  await industryModel.remove(id);
  return doc;
};
