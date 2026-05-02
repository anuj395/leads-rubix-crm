const sidebarService = require('../services/sidebarService');

exports.upsert = async (req, res, next) => {
  try {
    const { industry_id, role, menus } = req.body || {};
    const result = await sidebarService.upsertRole({ industry_id, role, menus });
    return res.status(200).json({ message: 'Sidebar role updated', industry_id: result.industry_id, roles: result.roles, is_ready_to_launch: result.is_ready_to_launch });
  } catch (err) {
    next(err);
  }
};

exports.getByIndustry = async (req, res, next) => {
  try {
    const { industry_id } = req.params;
    const doc = await sidebarService.getByIndustry(industry_id);
    if (!doc) return res.status(404).json({ message: 'Sidebar config not found' });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.getForUser = async (req, res, next) => {
  try {
    const { industry_id, role } = req.body || {};
    const menus = await sidebarService.getRoleMenus(industry_id, role);
    return res.json({ industry_id, role, menus });
  } catch (err) {
    next(err);
  }
};
