// src/routes/userRoutes.js
const express = require('express');
const { getAllUsers, getUserById, createUser } = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { permit, permitAtLeast } = require('../middlewares/rbac');

const router = express.Router();

// listing and creation require admin or higher
router.get('/', authenticate, permitAtLeast('admin'), getAllUsers);
router.post('/', authenticate, permitAtLeast('admin'), createUser);

// getting individual user requires authentication only
router.get('/:id', authenticate, getUserById);

module.exports = router;
