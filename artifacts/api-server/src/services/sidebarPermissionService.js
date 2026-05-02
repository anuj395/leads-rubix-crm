const permModel = require('../models/sidebarPermissionModel');
const roleModel = require('../models/roleModel');
const industryModel = require('../models/industryModel');
const menuModel = require('../models/sidebarMenuModel');

exports.list = (opts) => permModel.list(opts);

exports.upsert = async (payload) => {
  const { role_id, industry_id, menu_id } = payload || {};
  if (!role_id || !industry_id || !menu_id) {
    const err = new Error('role_id, industry_id and menu_id are required');
    err.status = 400;
    throw err;
  }
  const [role, industry, menu] = await Promise.all([
    roleModel.findById(role_id),
    industryModel.findById(industry_id),
    menuModel.findById(menu_id),
  ]);
  if (!role || !industry || !menu) {
    const err = new Error('role, industry or menu not found');
    err.status = 404;
    throw err;
  }
  if (String(role.industry_id) !== String(industry._id)) {
    const err = new Error('role does not belong to the given industry');
    err.status = 400;
    throw err;
  }
  return permModel.upsert(payload);
};

exports.bulkSet = async ({ role_id, industry_id, menu_ids }) => {
  if (!role_id || !industry_id) {
    const err = new Error('role_id and industry_id are required');
    err.status = 400;
    throw err;
  }
  const [role, industry] = await Promise.all([
    roleModel.findById(role_id),
    industryModel.findById(industry_id),
  ]);
  if (!role || !industry) {
    const err = new Error('role or industry not found');
    err.status = 404;
    throw err;
  }
  if (String(role.industry_id) !== String(industry._id)) {
    const err = new Error('role does not belong to the given industry');
    err.status = 400;
    throw err;
  }
  return permModel.bulkSetForRoleIndustry({ role_id, industry_id, menu_ids });
};

exports.remove = async (id) => permModel.remove(id);
