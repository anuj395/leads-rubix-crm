const mongoose = require('mongoose');

const KEY_MAP = {
  resource_property_types: 'PropertyTypes',
  resource_property_sub_types: 'PropertySubTypes',
  resource_budgets: 'budgets',
  resource_locations: 'locations',
  resource_lead_sources: 'leadSources',
  resource_transfer_reasons: 'TransferReasons',
  resource_property_stages: 'PropertyStages',
  resource_carousel: 'carousel',
  resource_projects: 'projects',
};

function getFieldName(resourceKey) {
  return KEY_MAP[resourceKey] || resourceKey;
}

const organizationResourcesSchema = new mongoose.Schema(
  {
    organization_id: { type: String, default: null, index: true },
    PropertyStages: { type: Array, default: [] },
    PropertySubTypes: { type: Array, default: [] },
    PropertyTypes: { type: Array, default: [] },
    TransferReasons: { type: Array, default: [] },
    budgets: { type: Array, default: [] },
    carousel: { type: Array, default: [] },
    leadSources: { type: Array, default: [] },
    locations: { type: Array, default: [] },
    projects: { type: Array, default: [] },
  },
  { timestamps: true, strict: false }
);

const OrganizationResources = mongoose.model('OrganizationResources', organizationResourcesSchema, 'resource_items');

exports.ResourceItem = OrganizationResources;

exports.list = async ({ organization_id, resource_key, all = false } = {}) => {
  if (resource_key === 'resource_projects' && all) {
    const docs = await OrganizationResources.find({}).lean().exec();
    const allProjects = [];
    const Organization = mongoose.model('Organization');
    const orgs = await Organization.find({}).lean().exec();
    const orgMap = {};
    orgs.forEach(o => {
      orgMap[o.organization_id || o._id.toString()] = o.name || o.organization_name || '';
    });

    docs.forEach(doc => {
      const orgId = doc.organization_id;
      const orgName = orgMap[orgId] || '';
      if (Array.isArray(doc.projects)) {
        doc.projects.forEach(p => {
          allProjects.push({
            organization_id: orgId,
            organization_name: orgName,
            ...p,
          });
        });
      }
    });

    return allProjects.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const db = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return db - da;
    });
  }

  let doc = await OrganizationResources.findOne({ organization_id }).lean().exec();
  // Fallback to global defaults if no custom organization resources document exists yet
  if (!doc && organization_id !== null && organization_id !== 'null' && organization_id !== '') {
    doc = await OrganizationResources.findOne({ organization_id: null }).lean().exec();
  }
  if (!doc) return [];
  const fieldName = getFieldName(resource_key);
  const items = doc[fieldName] || [];
  // Sort by createdAt descending (matching old behavior)
  return [...items].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const db = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return db - da;
  });
};

exports.findById = async (id) => {
  const doc = await OrganizationResources.findOne({
    $or: Object.values(KEY_MAP).map(field => ({ [`${field}.id`]: id }))
  }).lean().exec();

  if (!doc) return null;
  for (const field of Object.values(KEY_MAP)) {
    if (doc[field]) {
      const item = doc[field].find(i => String(i.id) === String(id));
      if (item) {
        return {
          ...item,
          organization_id: doc.organization_id,
        };
      }
    }
  }
  return null;
};

exports.create = async ({ organization_id, resource_key, data }) => {
  let doc = await OrganizationResources.findOne({ organization_id }).exec();
  if (!doc) {
    doc = new OrganizationResources({ organization_id });
  }

  const itemId = new mongoose.Types.ObjectId().toString();
  const fieldName = getFieldName(resource_key);

  const newItem = {
    id: itemId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (resource_key === 'resource_lead_sources') {
    newItem.leadSourceId = itemId;
  }

  if (!doc[fieldName]) {
    doc[fieldName] = [];
  }
  doc[fieldName].push(newItem);
  doc.markModified(fieldName);
  await doc.save();

  return newItem;
};

exports.update = async (id, data) => {
  const doc = await OrganizationResources.findOne({
    $or: Object.values(KEY_MAP).map(field => ({ [`${field}.id`]: id }))
  }).exec();

  if (!doc) return null;

  for (const field of Object.values(KEY_MAP)) {
    if (doc[field]) {
      const idx = doc[field].findIndex(i => String(i.id) === String(id));
      if (idx !== -1) {
        const updatePayload = { ...data };
        if (field === 'leadSources') {
          updatePayload.leadSourceId = id;
        }
        doc[field][idx] = {
          ...doc[field][idx],
          ...updatePayload,
          updatedAt: new Date(),
        };
        doc.markModified(field);
        await doc.save();
        return doc[field][idx];
      }
    }
  }
  return null;
};

exports.remove = async (id) => {
  const doc = await OrganizationResources.findOne({
    $or: Object.values(KEY_MAP).map(field => ({ [`${field}.id`]: id }))
  }).exec();

  if (!doc) return null;

  for (const field of Object.values(KEY_MAP)) {
    if (doc[field]) {
      const idx = doc[field].findIndex(i => String(i.id) === String(id));
      if (idx !== -1) {
        const removed = doc[field][idx];
        doc[field].splice(idx, 1);
        doc.markModified(field);
        await doc.save();
        return removed;
      }
    }
  }
  return null;
};
