const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Helper to generate a unique API Key matching old project style (12 chars uppercase alphanumeric)
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const ApiToken = mongoose.model('ApiToken');
    const Organization = mongoose.model('Organization');

    let query = {};
    let orgMap = {};

    if (req.user.role === 'superAdmin') {
      const orgs = await Organization.find({}).lean().exec();
      orgs.forEach(o => {
        if (o.organization_id) {
          orgMap[o.organization_id] = o.name || o.organization_id;
        }
      });
    } else {
      const org = await Organization.findOne({ industryId: req.user.industry_id }).exec();
      const orgId = org ? org.organization_id : null;
      if (!orgId) {
        return res.json([]);
      }
      query = { organization_id: orgId };
      orgMap[orgId] = org.name || org.organization_id;
    }

    const tokens = await ApiToken.find(query).sort({ createdAt: -1 }).lean().exec();

    const formatted = tokens.map(t => ({
      ...t,
      id: t._id,
      organization_name: orgMap[t.organization_id] || '',
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const ApiToken = mongoose.model('ApiToken');
    const Organization = mongoose.model('Organization');

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    let orgId = req.body.organization_id || null;

    if (req.user.role !== 'superAdmin') {
      const org = await Organization.findOne({ industryId: req.user.industry_id }).exec();
      orgId = org ? org.organization_id : null;
      if (!orgId) {
        return res.status(400).json({ message: 'Organization ID is mandatory for Admin users' });
      }
    }

    const payload = {
      organization_id: orgId,
      source: req.body.source,
      leadSourceId: req.body.leadSourceId || req.body.leadSource_id,
      country_code: req.body.country_code || '+91',
      status: req.body.status || 'ACTIVE',
      api_key: req.body.api_key || generateApiKey(),
    };

    const doc = await ApiToken.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const ApiToken = mongoose.model('ApiToken');
    const Organization = mongoose.model('Organization');

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = await ApiToken.findById(id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'API token config not found' });
    }

    if (req.user.role !== 'superAdmin') {
      const org = await Organization.findOne({ industryId: req.user.industry_id }).exec();
      const orgId = org ? org.organization_id : null;
      if (String(doc.organization_id) !== String(orgId)) {
        return res.status(403).json({ message: 'Forbidden: Cannot edit configuration of another organization' });
      }
    }

    const { api_key, organization_id, _id, id: bodyId, ...updatePayload } = req.body || {};

    Object.assign(doc, updatePayload);
    await doc.save();

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const ApiToken = mongoose.model('ApiToken');
    const Organization = mongoose.model('Organization');

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = await ApiToken.findById(id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'API token config not found' });
    }

    if (req.user.role !== 'superAdmin') {
      const org = await Organization.findOne({ industryId: req.user.industry_id }).exec();
      const orgId = org ? org.organization_id : null;
      if (String(doc.organization_id) !== String(orgId)) {
        return res.status(403).json({ message: 'Forbidden: Cannot delete configuration of another organization' });
      }
    }

    await doc.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
