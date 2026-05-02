const sidebarModel = require('../models/sidebarModel');

exports.upsertRole = async ({ industry_id, role, menus }) => {
  if (!industry_id || !role) {
    const err = new Error('industry_id and role are required');
    err.status = 400;
    throw err;
  }

  const result = await sidebarModel.upsertRole({ industry_id, role, menus: menus || [] });
  const doc = result.document;

  return {
    industry_id: doc.industry_id,
    roles: doc.roles,
    is_ready_to_launch: !!doc.is_ready_to_launch,
    created: !!result.created,
    fullDocument: doc,
  };
};

exports.getByIndustry = async (industry_id) => {
  if (!industry_id) {
    const err = new Error('industry_id is required');
    err.status = 400;
    throw err;
  }
  return sidebarModel.findByIndustry(industry_id);
};

exports.getRoleMenus = async (industry_id, role) => {
  if (!industry_id || !role) {
    const err = new Error('industry_id and role are required');
    err.status = 400;
    throw err;
  }
  return sidebarModel.getRoleMenus(industry_id, role);
};
