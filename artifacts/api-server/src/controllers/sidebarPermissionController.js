const service = require('../services/sidebarPermissionService');

exports.list = async (req, res, next) => {
  try {
    const { role_id, industry_id, menu_id, visible } = req.query;
    const docs = await service.list({
      role_id,
      industry_id,
      menu_id,
      visibleOnly: visible === 'true',
    });
    res.json({ items: docs });
  } catch (err) {
    next(err);
  }
};

exports.upsert = async (req, res, next) => {
  try {
    const doc = await service.upsert(req.body || {});
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};

exports.bulkSet = async (req, res, next) => {
  try {
    const { role_id, industry_id, menu_ids } = req.body || {};
    const docs = await service.bulkSet({ role_id, industry_id, menu_ids });
    res.json({ items: docs });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
