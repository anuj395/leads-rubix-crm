// src/controllers/userController.js
const userService = require('../services/userService');

exports.getAllUsers = async (req, res, next) => {
  try {
    const items = await userService.fetchAll({
      authedUser: req.user,
      industry_id: req.query.industry_id,
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.fetchById({ id: req.params.id, authedUser: req.user });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const created = await userService.create({ payload: req.body, authedUser: req.user });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updated = await userService.update({
      id: req.params.id,
      payload: req.body,
      authedUser: req.user,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await userService.remove({ id: req.params.id, authedUser: req.user });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
