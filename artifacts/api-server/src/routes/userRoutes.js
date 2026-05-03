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
const { requireScreenAction } = require('../middlewares/screenAction');

const router = express.Router();

// Per-role View/Add/Edit/Delete on the `users` screen.
// SuperAdmin + admin pass implicitly; other roles need an explicit
// role_action_permission row enabling the action.
router.get('/',       authenticate, requireScreenAction('users', 'view'),   getAllUsers);
router.post('/',      authenticate, requireScreenAction('users', 'add'),    createUser);
router.put('/:id',    authenticate, requireScreenAction('users', 'edit'),   updateUser);
router.delete('/:id', authenticate, requireScreenAction('users', 'delete'), deleteUser);

// Reading an individual user record still goes through service-level
// object authz (same-industry / self / admin+).
router.get('/:id', authenticate, getUserById);

module.exports = router;
