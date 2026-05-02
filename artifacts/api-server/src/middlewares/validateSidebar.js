// Validation for new sidebar APIs
const ALLOWED_ROLES = ['admin', 'leadManager', 'teamLead', 'sales'];

function isMenuItemValid(m) {
  if (!m || typeof m !== 'object') return false;
  if (typeof m.key !== 'string' || m.key.length === 0) return false;
  if (typeof m.name !== 'string' || m.name.length === 0) return false;
  if (m.route !== undefined && typeof m.route !== 'string') return false;
  if (m.icon !== undefined && typeof m.icon !== 'string') return false;
  if (m.module !== undefined && typeof m.module !== 'string') return false;
  return true;
}

module.exports.validateUpsert = (req, res, next) => {
  const { industry_id, role, menus } = req.body || {};
  if (!industry_id || typeof industry_id !== 'string') {
    const err = new Error('industry_id is required and must be a string');
    err.status = 400;
    return next(err);
  }
  if (!role || typeof role !== 'string' || !ALLOWED_ROLES.includes(role)) {
    const err = new Error(`role is required and must be one of: ${ALLOWED_ROLES.join(', ')}`);
    err.status = 400;
    return next(err);
  }
  if (menus !== undefined) {
    if (!Array.isArray(menus)) {
      const err = new Error('menus must be an array of menu objects');
      err.status = 400;
      return next(err);
    }
    for (const m of menus) {
      if (!isMenuItemValid(m)) {
        const err = new Error('each menu must be an object with string "key" and "name"');
        err.status = 400;
        return next(err);
      }
    }
  }
  next();
};

module.exports.validateGet = (req, res, next) => {
  const { industry_id } = req.params || {};
  if (!industry_id || typeof industry_id !== 'string') {
    const err = new Error('industry_id param is required');
    err.status = 400;
    return next(err);
  }
  next();
};

module.exports.validateUserRequest = (req, res, next) => {
  const { industry_id, role } = req.body || {};
  if (!industry_id || typeof industry_id !== 'string') {
    const err = new Error('industry_id is required and must be a string');
    err.status = 400;
    return next(err);
  }
  if (!role || typeof role !== 'string' || !ALLOWED_ROLES.includes(role)) {
    const err = new Error(`role is required and must be one of: ${ALLOWED_ROLES.join(', ')}`);
    err.status = 400;
    return next(err);
  }
  next();
};
