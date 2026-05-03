const express = require('express');
const ctrl = require('../controllers/contactController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);

module.exports = router;
