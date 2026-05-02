const fieldModel = require('../models/screenFieldModel');
const screenModel = require('../models/screenModel');
const permissionModel = require('../models/screenPermissionModel');

exports.list = (opts) => fieldModel.list(opts);

exports.get = async (id) => {
  const doc = await fieldModel.findById(id);
  if (!doc) {
    const err = new Error('Field not found');
    err.status = 404;
    throw err;
  }
  return doc;
};

exports.create = async (payload) => {
  if (!payload?.screen_id || !payload?.field_key || !payload?.label) {
    const err = new Error('screen_id, field_key and label are required');
    err.status = 400;
    throw err;
  }
  const screen = await screenModel.findById(payload.screen_id);
  if (!screen) {
    const err = new Error('Screen not found');
    err.status = 404;
    throw err;
  }
  const dup = await fieldModel.findByScreenAndKey(payload.screen_id, payload.field_key);
  if (dup) {
    const err = new Error('Field with this key already exists for this screen');
    err.status = 409;
    throw err;
  }
  return fieldModel.create(payload);
};

exports.update = async (id, patch) => {
  const current = await fieldModel.findById(id);
  if (!current) {
    const err = new Error('Field not found');
    err.status = 404;
    throw err;
  }
  if (patch?.field_key) {
    const dup = await fieldModel.findByScreenAndKey(current.screen_id, patch.field_key);
    if (dup && String(dup._id) !== String(id)) {
      const err = new Error('Field with this key already exists for this screen');
      err.status = 409;
      throw err;
    }
  }
  return fieldModel.update(id, patch || {});
};

// Cascade: removing a field also removes its permission rows.
exports.remove = async (id) => {
  const doc = await fieldModel.findById(id);
  if (!doc) {
    const err = new Error('Field not found');
    err.status = 404;
    throw err;
  }
  await permissionModel.removeByField(id);
  await fieldModel.remove(id);
  return doc;
};
