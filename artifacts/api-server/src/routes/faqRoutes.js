const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const FAQ = mongoose.model('FAQ');
    const Organization = mongoose.model('Organization');

    let query = {};
    if (req.user.role !== 'superAdmin') {
      const org = await Organization.findOne({ industryId: req.user.industry_id }).exec();
      const orgId = org ? org.organization_id : null;
      query = {
        $or: [
          { organization_id: null },
          { organization_id: '' },
          ...(orgId ? [{ organization_id: orgId }] : [])
        ]
      };
    }

    const faqs = await FAQ.find(query).sort({ createdAt: 1 }).exec();
    res.json(faqs);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const FAQ = mongoose.model('FAQ');
    const Organization = mongoose.model('Organization');

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins and superAdmins can create FAQs' });
    }

    let orgId = null;
    if (req.user.role === 'admin') {
      const org = await Organization.findOne({ industryId: req.user.industry_id }).exec();
      orgId = org ? org.organization_id : null;
    }

    const payload = {
      ...(req.body || {}),
      organization_id: orgId,
      created_by: req.user.id,
    };

    const doc = await FAQ.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const FAQ = mongoose.model('FAQ');

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins and superAdmins can edit FAQs' });
    }

    const doc = await FAQ.findById(req.params.id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    if (req.user.role === 'admin') {
      if (String(doc.created_by) !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You can only edit FAQs that you created' });
      }
    }

    Object.assign(doc, req.body || {});
    await doc.save();
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const FAQ = mongoose.model('FAQ');

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins and superAdmins can delete FAQs' });
    }

    const doc = await FAQ.findById(req.params.id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    if (req.user.role === 'admin') {
      if (String(doc.created_by) !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You can only delete FAQs that you created' });
      }
    }

    await doc.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
