const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const FAQ = mongoose.model('FAQ');
    const faqs = await FAQ.find({}).sort({ createdAt: -1 }).exec();
    res.json(faqs);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const FAQ = mongoose.model('FAQ');
    const doc = await FAQ.create(req.body || {});
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const FAQ = mongoose.model('FAQ');
    const doc = await FAQ.findByIdAndUpdate(req.params.id, { $set: req.body || {} }, { new: true }).exec();
    if (!doc) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const FAQ = mongoose.model('FAQ');
    const doc = await FAQ.findByIdAndDelete(req.params.id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
