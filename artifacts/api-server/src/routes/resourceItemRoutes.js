const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middlewares/auth');
const resourceItemModel = require('../models/resourceItemModel');

const router = express.Router();

// Helper to resolve Organization ID
async function resolveOrganizationId(req) {
  const Organization = mongoose.model('Organization');
  
  if (req.user.role === 'superAdmin') {
    // SuperAdmin can specify organizationId in query or body
    let targetOrgId = req.query.organizationId || req.query.organization_id || req.body.organizationId || req.body.organization_id;
    if (targetOrgId === 'null' || targetOrgId === '') {
      return null;
    }
    if (targetOrgId) {
      return targetOrgId;
    }
    return null;
  } else {
    // Regular admin or user: resolve orgId via their user industry_id
    const org = await Organization.findOne({ industryId: req.user.industry_id }).exec();
    return org ? (org.organizationId || org.organization_id) : null;
  }
}

// Helper to resolve Industry ID
async function resolveIndustryId(req) {
  const { industryId, industry_id, industry_code } = { ...req.query, ...req.body };
  const target = industry_code || industryId || industry_id;
  if (target) {
    const Industry = mongoose.model('Industry');
    // Try to find by code first
    let ind = await Industry.findOne({ code: target }).lean().exec();
    if (ind) return ind._id;
    // If target is a valid ObjectId, try finding by _id
    if (mongoose.Types.ObjectId.isValid(target)) {
      ind = await Industry.findById(target).lean().exec();
      if (ind) return ind._id;
    }
  }
  return null;
}

router.get('/:resource_key', authenticate, async (req, res, next) => {
  try {
    const { resource_key } = req.params;

    const orgId = await resolveOrganizationId(req);
    if (req.user.role !== 'superAdmin' && !orgId) {
      return res.status(400).json({ message: 'Organization identifier is mandatory for Admin users' });
    }

    const industryId = await resolveIndustryId(req);

    const items = await resourceItemModel.list({
      resource_key,
      organizationId: orgId,
      industryId,
      all: req.query.all === 'true',
    });

    const formatted = items.map(item => ({
      id: item.id || item._id,
      ...item,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

router.post('/:resource_key', authenticate, async (req, res, next) => {
  try {
    const { resource_key } = req.params;

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const orgId = await resolveOrganizationId(req);
    if (req.user.role !== 'superAdmin' && !orgId) {
      return res.status(400).json({ message: 'Organization identifier is mandatory for Admin users' });
    }

    // Extract dynamic data (except system metadata)
    const { industry_code, industry_id, organizationId: bodyOrgId, organization_id, ...payloadData } = req.body || {};

    const industryId = await resolveIndustryId(req);

    const doc = await resourceItemModel.create({
      organizationId: orgId,
      industryId,
      resource_key,
      data: payloadData,
    });

    res.status(201).json({
      id: doc.id || doc._id,
      ...doc,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:resource_key/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = await resourceItemModel.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'Resource item not found' });
    }

    if (req.user.role !== 'superAdmin') {
      const Organization = mongoose.model('Organization');
      const org = await Organization.findOne({ industryId: req.user.industry_id }).exec();
      const userOrgId = org ? (org.organizationId || org.organization_id) : null;
      if (!userOrgId || String(doc.organizationId || doc.organization_id) !== String(userOrgId)) {
        return res.status(403).json({ message: 'Forbidden: Cannot edit resource from another organization' });
      }
    }

    const { industry_code, industry_id, organizationId: bodyOrgId, organization_id, id: bodyId, ...payloadData } = req.body || {};

    const updated = await resourceItemModel.update(id, payloadData);

    res.json({
      id: updated.id || updated._id,
      ...updated,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:resource_key/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = await resourceItemModel.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'Resource item not found' });
    }

    if (req.user.role !== 'superAdmin') {
      const Organization = mongoose.model('Organization');
      const org = await Organization.findOne({ industryId: req.user.industry_id }).exec();
      const userOrgId = org ? (org.organizationId || org.organization_id) : null;
      if (!userOrgId || String(doc.organizationId || doc.organization_id) !== String(userOrgId)) {
        return res.status(403).json({ message: 'Forbidden: Cannot delete resource from another organization' });
      }
    }

    await resourceItemModel.remove(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
