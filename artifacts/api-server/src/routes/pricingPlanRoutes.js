const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Helper middleware to ensure superAdmin role
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'superAdmin') {
    return res.status(403).json({ message: 'Access denied: Super Admin only' });
  }
  next();
};

router.get('/', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const PricingPlan = mongoose.model('PricingPlan');
    const plans = await PricingPlan.find({}).sort({ createdAt: -1 }).exec();
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const PricingPlan = mongoose.model('PricingPlan');
    const doc = await PricingPlan.create(req.body || {});
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const PricingPlan = mongoose.model('PricingPlan');
    const doc = await PricingPlan.findByIdAndUpdate(req.params.id, { $set: req.body || {} }, { new: true }).exec();
    if (!doc) {
      return res.status(404).json({ message: 'Pricing plan not found' });
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const PricingPlan = mongoose.model('PricingPlan');
    const doc = await PricingPlan.findByIdAndDelete(req.params.id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'Pricing plan not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
