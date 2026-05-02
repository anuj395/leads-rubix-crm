// src/controllers/userController.js
// controllers should be thin; delegate business logic to services and return responses
const userService = require('../services/userService');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.fetchAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.fetchById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const created = await userService.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};
