// src/middlewares/auth.js
// JWT-based authentication and role authorization
const authService = require('../services/authService');
const userModel = require('../models/userModel');

/**
 * Verifies the JWT then hydrates req.user from the DB so downstream code can
 * trust the latest role / industry / active flag (the JWT itself may pre-date
 * a profile change, and older tokens don't carry industry_id at all). This
 * is what makes tenant scoping in user CRUD reliable.
 */
module.exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const payload = authService.verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    const fresh = await userModel.findById(payload.id);
    if (!fresh || fresh.is_active === false) {
      return res.status(401).json({ message: 'Account is no longer active' });
    }
    req.user = {
      id: String(fresh._id),
      role: fresh.role,
      industry_id: fresh.industry_id,
      email: fresh.email,
    };
    next();
  } catch (err) {
    next(err);
  }
};

// middleware factory for roles
module.exports.authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;
    if (!userRole || (allowedRoles.length && !allowedRoles.includes(userRole))) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
