const express = require('express');
const ctrl = require('../controllers/screenController');
const { authenticate } = require('../middlewares/auth');
const { permit } = require('../middlewares/rbac');

const router = express.Router();

// Compose endpoint — used by all client pages to resolve their dynamic config.
router.post('/resolve', authenticate, ctrl.resolve);

// reads — any authenticated user
router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.get);

// writes — superAdmin only
router.post('/', authenticate, permit('superAdmin'), ctrl.create);
router.put('/:id', authenticate, permit('superAdmin'), ctrl.update);
router.delete('/:id', authenticate, permit('superAdmin'), ctrl.remove);

module.exports = router;
