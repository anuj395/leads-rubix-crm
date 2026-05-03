const roleModel = require('../models/roleModel');
const industryModel = require('../models/industryModel');
const permissionModel = require('../models/sidebarPermissionModel');
const screenPermissionModel = require('../models/screenPermissionModel');
const roleActionPermissionModel = require('../models/roleActionPermissionModel');

exports.list = (opts) => roleModel.list(opts);

exports.get = async (id) => {
  const doc = await roleModel.findById(id);
  if (!doc) {
    const err = new Error('Role not found');
    err.status = 404;
    throw err;
  }
  return doc;
};

exports.create = async (payload) => {
  if (!payload?.industry_id || !payload?.key || !payload?.name) {
    const err = new Error('industry_id, key and name are required');
    err.status = 400;
    throw err;
  }
  const industry = await industryModel.findById(payload.industry_id);
  if (!industry) {
    const err = new Error('Industry not found');
    err.status = 404;
    throw err;
  }
  const dup = await roleModel.findByIndustryAndKey(payload.industry_id, payload.key);
  if (dup) {
    const err = new Error('Role with this key already exists for this industry');
    err.status = 409;
    throw err;
  }
  return roleModel.create(payload);
};

exports.update = async (id, patch) => {
  if (patch?.industry_id && patch?.key) {
    const dup = await roleModel.findByIndustryAndKey(patch.industry_id, patch.key);
    if (dup && String(dup._id) !== String(id)) {
      const err = new Error('Role with this key already exists for this industry');
      err.status = 409;
      throw err;
    }
  }
  const doc = await roleModel.update(id, patch || {});
  if (!doc) {
    const err = new Error('Role not found');
    err.status = 404;
    throw err;
  }
  return doc;
};

// Cascade: removing a role wipes its permission rows so we don't leave orphans.
exports.remove = async (id) => {
  const doc = await roleModel.findById(id);
  if (!doc) {
    const err = new Error('Role not found');
    err.status = 404;
    throw err;
  }

  if (typeof permissionModel.removeByRole === 'function') {
    await permissionModel.removeByRole(id);
  } else if (typeof permissionModel.deleteMany === 'function') {
    await permissionModel.deleteMany({ role_id: id });
  }

  // Cascade: also wipe screen-permission rows for this role so the normalized
  // screen-config tables don't keep orphans either.
  if (typeof screenPermissionModel.removeByRole === 'function') {
    await screenPermissionModel.removeByRole(id);
  } else if (typeof screenPermissionModel.deleteMany === 'function') {
    await screenPermissionModel.deleteMany({ role_id: id });
  }

  // Cascade: also wipe role-action permission rows for this role.
  if (typeof roleActionPermissionModel.removeByRole === 'function') {
    await roleActionPermissionModel.removeByRole(id);
  }

  await roleModel.remove(id);
  return doc;
};
