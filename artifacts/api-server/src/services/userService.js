// src/services/userService.js
// business logic lives here. could interact with models / external APIs
const userModel = require('../models/userModel');

exports.fetchAll = async () => {
  const users = await userModel.findAll();
  return users.map(u => ({ id: u.id, email: u.email, role: u.role }));
};

exports.fetchById = async (id) => {
  const u = await userModel.findById(id);
  if (!u) return null;
  return { id: u.id, email: u.email, role: u.role };
};

exports.create = async (data) => {
  const user = await userModel.create(data);
  return { id: user.id, email: user.email, role: user.role };
};
