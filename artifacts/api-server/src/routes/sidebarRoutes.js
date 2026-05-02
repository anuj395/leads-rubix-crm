const express = require('express');
const { upsert, getByIndustry, getForUser } = require('../controllers/sidebarController');
const { validateUpsert, validateGet, validateUserRequest } = require('../middlewares/validateSidebar');

const router = express.Router();

// Create / Update a single role inside the industry's sidebar config
router.post('/', validateUpsert, upsert);

// Get full sidebar config by industry
router.get('/:industry_id', validateGet, getByIndustry);

// Return only menus for a user's role
router.post('/user', validateUserRequest, getForUser);

module.exports = router;

