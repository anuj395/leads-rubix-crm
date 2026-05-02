const service = require('../services/screenService');
const permissionService = require('../services/screenPermissionService');

exports.list = async (req, res, next) => {
  try {
    const items = await service.list({ activeOnly: req.query.active === 'true' });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const item = await service.update(req.params.id, req.body);
    res.json(item);
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

exports.resolve = async (req, res, next) => {
  try {
    const { screen_key, industry_code, role_key } = req.body || {};

    // Access control: only superAdmins may resolve a (industry, role) other
    // than their own. For everyone else we ignore client-supplied
    // industry_code / role_key and force the resolver to fall back to req.user
    // — preventing IDOR-style cross-scope config exposure.
    const isSuperAdmin = req.user?.role === 'superAdmin';
    const out = await permissionService.resolve({
      screen_key,
      industry_code: isSuperAdmin ? industry_code : undefined,
      role_key: isSuperAdmin ? role_key : undefined,
      authedUser: req.user,
    });
    res.json(out);
  } catch (err) {
    next(err);
  }
};
