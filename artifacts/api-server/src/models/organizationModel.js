const mongoose = require('mongoose');

/**
 * Organizations use a freeform schema (`strict: false`) because their
 * available fields are configured at runtime via the `organization` screen
 * in the screen-config system — exactly like Contacts. We track owner /
 * tenant scope and timestamps for ordering and access control.
 */
const organizationSchema = new mongoose.Schema(
  {
    organizationId: { type: String, alias: 'organization_id' },
    organizationName: { type: String, alias: 'organization_name' },
    contactNumber: { type: String, default: '', alias: 'contact_no' },
    industryId: { type: String, default: null, alias: 'industry_id' }, // industry code, mirrors user.industry_id
    isActive: { type: Boolean, default: true, alias: 'is_active' },
    createdBy: { type: String, default: null, alias: 'created_by' },
  },
  { 
    timestamps: true, 
    strict: false, 
    minimize: false,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
  },
);

const Organization = mongoose.model('Organization', organizationSchema, 'organizations');

exports.Organization = Organization;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ALLOWED_SORT = new Set(['createdAt', 'updatedAt', 'is_active']);

exports.listPaged = async ({
  industry_id,
  q,
  page = 0,
  pageSize = 25,
  sortField,
  sortDir,
  searchKeys = [],
} = {}) => {
  const filter = {};
  if (industry_id) filter.industryId = industry_id;
  if (q && String(q).trim()) {
    const re = new RegExp(escapeRegex(String(q).trim()), 'i');
    // Match against any of the screen-config field keys the caller exposes,
    // falling back to a couple of likely-used keys when nothing was passed in.
    const keys = searchKeys.length > 0 ? searchKeys : ['name', 'code', 'email'];
    filter.$or = keys.map((k) => ({ [k]: re }));
  }

  const safeSort = ALLOWED_SORT.has(sortField) ? sortField : 'createdAt';
  const dir = sortDir === 'asc' ? 1 : -1;
  const limit = Math.min(Math.max(Number(pageSize) || 25, 1), 200);
  const skip = Math.max(Number(page) || 0, 0) * limit;

  const [items, total] = await Promise.all([
    Organization.find(filter).sort({ [safeSort]: dir }).skip(skip).limit(limit).lean().exec(),
    Organization.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

exports.findById = async (id) => Organization.findById(id).lean().exec();

exports.create = async (payload) => {
  const doc = await Organization.create(payload);
  return doc.toObject();
};

exports.update = async (id, patch) => {
  const $set = { ...patch };
  if (patch.organization_id !== undefined) {
    $set.organizationId = patch.organization_id;
    delete $set.organization_id;
  }
  if (patch.organization_name !== undefined) {
    $set.organizationName = patch.organization_name;
    delete $set.organization_name;
  }
  if (patch.contact_no !== undefined) {
    $set.contactNumber = patch.contact_no;
    delete $set.contact_no;
  }
  if (patch.industry_id !== undefined) {
    $set.industryId = patch.industry_id;
    delete $set.industry_id;
  }
  if (patch.is_active !== undefined) {
    $set.isActive = patch.is_active;
    delete $set.is_active;
  }
  if (patch.created_by !== undefined) {
    $set.createdBy = patch.created_by;
    delete $set.created_by;
  }
  return Organization.findByIdAndUpdate(id, { $set }, { new: true }).lean().exec();
};

exports.remove = async (id) => Organization.findByIdAndDelete(id).lean().exec();
