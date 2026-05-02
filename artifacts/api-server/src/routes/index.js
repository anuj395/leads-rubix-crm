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

module.exports = router;
