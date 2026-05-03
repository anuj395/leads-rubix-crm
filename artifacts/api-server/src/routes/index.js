// src/routes/index.js
// central router that aggregates sub-routers
const express = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const sidebarRoutes = require('./sidebarRoutes');
const industryRoutes = require('./industryRoutes');
const roleRoutes = require('./roleRoutes');
const sidebarMenuRoutes = require('./sidebarMenuRoutes');
const sidebarPermissionRoutes = require('./sidebarPermissionRoutes');
const screenRoutes = require('./screenRoutes');
const screenFieldRoutes = require('./screenFieldRoutes');
const screenPermissionRoutes = require('./screenPermissionRoutes');
const contactRoutes = require('./contactRoutes');
const optionsRoutes = require('./optionsRoutes');
const screenController = require('../controllers/screenController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sidebar', sidebarRoutes);
router.use('/industries', industryRoutes);
router.use('/roles', roleRoutes);
router.use('/sidebar-menus', sidebarMenuRoutes);
router.use('/sidebar-permissions', sidebarPermissionRoutes);
router.use('/screens', screenRoutes);
router.use('/screen-fields', screenFieldRoutes);
router.use('/screen-permissions', screenPermissionRoutes);
router.use('/contacts', contactRoutes);
router.use('/options', optionsRoutes);

// Compat alias: GET /api/form-config?screen=contacts → flat form_fields[]
// (matches the legacy contract some clients still use; internally calls the
// same resolver as POST /api/screens/resolve so behavior stays in sync.)
router.get('/form-config', authenticate, async (req, res, next) => {
  try {
    const fakeReq = {
      user: req.user,
      body: { screen_key: req.query.screen },
    };
    const fakeRes = { json: (out) => res.json(out.form_fields || []) };
    await screenController.resolve(fakeReq, fakeRes, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
