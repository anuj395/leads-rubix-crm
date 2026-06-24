const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const News = mongoose.model('News');
    const Organization = mongoose.model('Organization');

    let query = {};
    if (req.user.role !== 'superAdmin') {
      const org = await Organization.findOne({ industry_id: req.user.industry_id }).exec();
      const orgId = org ? org.organization_id : null;
      query = {
        $or: [
          { organization_id: null },
          { organization_id: '' },
          ...(orgId ? [{ organization_id: orgId }] : [])
        ]
      };
    }

    const newsItems = await News.find(query).sort({ createdAt: 1 }).exec();
    res.json(newsItems);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const News = mongoose.model('News');
    const Organization = mongoose.model('Organization');

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins and superAdmins can create news articles' });
    }

    let orgId = null;
    if (req.user.role === 'admin') {
      const org = await Organization.findOne({ industry_id: req.user.industry_id }).exec();
      orgId = org ? org.organization_id : null;
    }

    const payload = {
      ...(req.body || {}),
      organization_id: orgId,
      created_by: req.user.id,
    };

    const doc = await News.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const News = mongoose.model('News');

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins and superAdmins can edit news articles' });
    }

    const doc = await News.findById(req.params.id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'News article not found' });
    }

    if (req.user.role === 'admin') {
      if (String(doc.created_by) !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You can only edit news articles that you created' });
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
    const News = mongoose.model('News');

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins and superAdmins can delete news articles' });
    }

    const doc = await News.findById(req.params.id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'News article not found' });
    }

    if (req.user.role === 'admin') {
      if (String(doc.created_by) !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You can only delete news articles that you created' });
      }
    }

    await doc.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
