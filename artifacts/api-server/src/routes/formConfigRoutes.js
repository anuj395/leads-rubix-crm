const express = require('express');
const router = express.Router();
const controller = require('../controllers/formConfigController');

// POST /api/form-configs
router.post('/', controller.createFormConfig);

// GET /api/form-configs
router.get('/', controller.getAllFormConfigs);

// GET /api/form-configs/:form_name
router.get('/:form_name', controller.getFormConfigByName);

// PUT /api/form-configs/:id
router.put('/:id', controller.updateFormConfig);

// DELETE /api/form-configs/:id
router.delete('/:id', controller.deleteFormConfig);

module.exports = router;
