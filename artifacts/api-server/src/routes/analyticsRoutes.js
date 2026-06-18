const express = require('express');
const ctrl = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/dashboard', authenticate, ctrl.getAnalyticsDashboardData);

module.exports = router;
