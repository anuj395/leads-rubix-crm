// src/routes/userRoutes.js
const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { permitAtLeast } = require('../middlewares/rbac');

const router = express.Router();

// Listing / mutation require admin or higher.
router.get('/',           authenticate, permitAtLeast('admin'), getAllUsers);
router.post('/',          authenticate, permitAtLeast('admin'), createUser);
router.put('/:id',        authenticate, permitAtLeast('admin'), updateUser);
router.delete('/:id',     authenticate, permitAtLeast('admin'), deleteUser);

// Reading an individual user only needs auth.
router.get('/:id', authenticate, getUserById);

module.exports = router;
