// src/middlewares/screenAction.js
// Express middleware factory that enforces per-role View/Add/Edit/Delete
// permissions on a given screen. SuperAdmin and admin are implicit allow.
const svc = require('../services/roleActionPermissionService');

exports.requireScreenAction = (screen_key, action) => async (req, res, next) => {
  try {
    const ok = await svc.userCan({ authedUser: req.user, screen_key, action });
    if (!ok) return res.status(403).json({ message: 'Forbidden' });
    next();
  } catch (err) {
    next(err);
  }
};
