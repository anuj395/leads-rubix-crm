const ALLOWED_TYPES = ['text', 'number', 'date'];

function isHeaderItemValid(h) {
  if (!h || typeof h !== 'object') return false;
  if (typeof h.key !== 'string' || h.key.length === 0) return false;
  if (typeof h.label !== 'string' || h.label.length === 0) return false;
  if (h.type !== undefined && typeof h.type !== 'string') return false;
  if (h.type !== undefined && !ALLOWED_TYPES.includes(h.type)) return false;
  if (h.visible !== undefined && typeof h.visible !== 'boolean') return false;
  if (h.sortable !== undefined && typeof h.sortable !== 'boolean') return false;
  return true;
}

module.exports.validateUpsert = (req, res, next) => {
  const { industry_id, screens } = req.body || {};
  if (!industry_id || typeof industry_id !== 'string') {
    const err = new Error('industry_id is required and must be a string');
    err.status = 400;
    return next(err);
  }
  if (screens !== undefined) {
    if (!Array.isArray(screens)) {
      const err = new Error('screens must be an array');
      err.status = 400;
      return next(err);
    }
    for (const s of screens) {
      if (!s || typeof s.screen !== 'string' || s.screen.length === 0) {
        const err = new Error('each screen must have a string "screen" property');
        err.status = 400;
        return next(err);
      }
      if (s.headers !== undefined) {
        if (!Array.isArray(s.headers)) {
          const err = new Error('headers must be an array');
          err.status = 400;
          return next(err);
        }
        for (const h of s.headers) {
          if (!isHeaderItemValid(h)) {
            const err = new Error('each header must have string "key" and "label", optional "type","visible","sortable"');
            err.status = 400;
            return next(err);
          }
        }
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
