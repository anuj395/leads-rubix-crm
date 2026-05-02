const express = require('express');
const { upsertIndustry, getByIndustry } = require('../controllers/tableConfigController');
const { validateUpsert, validateGet } = require('../middlewares/validateHeaders');

const router = express.Router();

// Upsert entire industry table config (screens array)
router.post('/', validateUpsert, upsertIndustry);

// Get full industry table config
router.get('/:industry_id', validateGet, getByIndustry);

module.exports = router;
