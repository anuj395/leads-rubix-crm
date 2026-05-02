// src/routes/index.js
// central router that aggregates sub-routers
const express = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const sidebarRoutes = require('./sidebarRoutes');
const tableConfigRoutes = require('./tableConfigRoutes');
const formConfigRoutes = require('./formConfigRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sidebar', sidebarRoutes);
router.use('/table-configs', tableConfigRoutes);
router.use('/form-configs', formConfigRoutes);

module.exports = router;
