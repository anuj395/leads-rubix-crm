const screenModel = require('../models/screenModel');
const fieldModel = require('../models/screenFieldModel');
const permissionModel = require('../models/screenPermissionModel');

exports.list = (opts) => screenModel.list(opts);

exports.get = async (id) => {
  const doc = await screenModel.findById(id);
  if (!doc) {
    const err = new Error('Screen not found');
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
  const dup = await screenModel.findByKey(payload.key);
  if (dup) {
    const err = new Error('Screen with this key already exists');
    err.status = 409;
    throw err;
  }
  return screenModel.create(payload);
};

exports.update = async (id, patch) => {
  if (patch?.key) {
    const dup = await screenModel.findByKey(patch.key);
    if (dup && String(dup._id) !== String(id)) {
      const err = new Error('Screen with this key already exists');
      err.status = 409;
      throw err;
    }
  }
  const doc = await screenModel.update(id, patch || {});
  if (!doc) {
    const err = new Error('Screen not found');
    err.status = 404;
    throw err;
  }
  return doc;
};

// Cascade: deleting a screen wipes all of its fields and any permission rows
// referencing the screen (which transitively covers the deleted fields).
exports.remove = async (id) => {
  const doc = await screenModel.findById(id);
  if (!doc) {
    const err = new Error('Screen not found');
    err.status = 404;
    throw err;
  }
  await permissionModel.removeByScreen(id);
  await fieldModel.removeByScreen(id);
  try {
    const roleActionPermissionModel = require('../models/roleActionPermissionModel');
    if (typeof roleActionPermissionModel.removeByScreen === 'function') {
      await roleActionPermissionModel.removeByScreen(id);
    }
  } catch { /* model not loaded — nothing to cascade */ }
  await screenModel.remove(id);
  return doc;
};
