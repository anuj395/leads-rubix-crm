// src/services/roleActionPermissionService.js
const mongoose = require('mongoose');
const model = require('../models/roleActionPermissionModel');
const screenModel = require('../models/screenModel');
const roleModel = require('../models/roleModel');

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v ?? ''));

const ACTIONS = ['view', 'add', 'edit', 'delete'];

exports.ACTIONS = ACTIONS;

exports.list = ({ role_id, industry_id, screen_id }) =>
  model.list({ role_id, industry_id, screen_id });

exports.upsert = async ({ role_id, industry_id, screen_id, can_view, can_add, can_edit, can_delete }) => {
  if (!role_id || !industry_id || !screen_id) {
    const e = new Error('role_id, industry_id and screen_id are required'); e.status = 400; throw e;
  }
  if (!isObjectId(role_id) || !isObjectId(industry_id) || !isObjectId(screen_id)) {
    const e = new Error('role_id, industry_id and screen_id must be valid ObjectIds'); e.status = 400; throw e;
  }
  // Ensure referenced docs actually exist and that the role belongs to the
  // requested industry — prevents orphan / cross-industry rows from direct API calls.
  const [role, screen] = await Promise.all([
    roleModel.findById(role_id),
    screenModel.findById(screen_id),
  ]);
  if (!role)   { const e = new Error('Role not found');   e.status = 404; throw e; }
  if (!screen) { const e = new Error('Screen not found'); e.status = 404; throw e; }
  if (String(role.industry_id) !== String(industry_id)) {
    const e = new Error('Role does not belong to the specified industry'); e.status = 400; throw e;
  }
  return model.upsert({ role_id, industry_id, screen_id, can_view, can_add, can_edit, can_delete });
};

/**
 * Resolve whether the authenticated caller is allowed to perform `action` on
 * `screen_key`. SuperAdmin and admin always pass — they're the privileged
 * tier per product spec. Other roles need an explicit row.
 */
exports.userCan = async ({ authedUser, screen_key, action }) => {
  if (!authedUser) return false;
  if (!ACTIONS.includes(action)) return false;
  if (authedUser.role === 'superAdmin' || authedUser.role === 'admin') return true;
  if (!authedUser.industry_id) return false;

  const screen = await screenModel.findByKey(screen_key);
  if (!screen || !screen.is_active) return false;
  const role = await roleModel.findByIndustryAndKey(authedUser.industry_id, authedUser.role);
  if (!role) return false;

  const row = await model.findFor({
    role_id: role._id,
    industry_id: authedUser.industry_id,
    screen_id: screen._id,
  });
  if (!row) return false;
  return !!row[`can_${action}`];
};

exports.getEffectiveForScreen = async ({ authedUser, screen_key }) => {
  const out = { can_view: false, can_add: false, can_edit: false, can_delete: false };
  if (authedUser?.role === 'superAdmin' || authedUser?.role === 'admin') {
    return { can_view: true, can_add: true, can_edit: true, can_delete: true };
  }
  for (const a of ACTIONS) {
    out[`can_${a}`] = await exports.userCan({ authedUser, screen_key, action: a });
  }
  return out;
};
