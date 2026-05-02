// src/middlewares/auth.js
// JWT-based authentication and role authorization
const authService = require('../services/authService');

module.exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  req.user = payload; // { id, role }
  next();
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
