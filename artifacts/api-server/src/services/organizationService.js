// src/services/organizationService.js
// Business logic for the Organization module. Mirrors userService — every
// dynamic field on `organizations` is validated against the `organization`
// screen config so SuperAdmin can drive the form/table entirely from the
// Field Manager UI without touching code.

const organizationModel = require('../models/organizationModel');
const screenModel = require('../models/screenModel');
const fieldModel = require('../models/screenFieldModel');
const permissionModel = require('../models/screenPermissionModel');
const userModel = require('../models/userModel');
const industryModel = require('../models/industryModel');
const roleModel = require('../models/roleModel');

const ORG_SCREEN_KEY = 'organization';

async function resolveActor(authedUser) {
  if (!authedUser?.id) {
    const err = new Error('Authentication required'); err.status = 401; throw err;
  }
  const user = await userModel.findById(authedUser.id);
  if (!user) {
    const err = new Error('Authenticated user not found'); err.status = 401; throw err;
  }
  return user;
}

/**
 * Returns the form-visible fields the (role × industry) caller is allowed to
 * write on an Organization. SuperAdmin can use every active form field.
 */
async function resolveAllowedFormFields({ industry_code, role_key, isSuperAdmin }) {
  const screen = await screenModel.findByKey(ORG_SCREEN_KEY);
  if (!screen || !screen.is_active) {
    return { screen: null, fields: [] };
  }
  const fields = await fieldModel.list({ screen_id: screen._id, activeOnly: true });

  if (isSuperAdmin) {
    return { screen, fields: fields.filter((f) => f.is_form_visible) };
  }

  const industry = await industryModel.findByCode(industry_code);
  if (!industry) return { screen, fields: [] };
  const role = await roleModel.findByIndustryAndKey(industry._id, role_key);
  if (!role) return { screen, fields: [] };

  const perms = await permissionModel.list({
    screen_id: screen._id,
    role_id: role._id,
    industry_id: industry._id,
    enabledOnly: true,
  });
  const allowedIds = new Set(perms.map((p) => String(p.field_id)));
  return {
    screen,
    fields: fields.filter((f) => f.is_form_visible && allowedIds.has(String(f._id))),
  };
}

function pickAllowed(payload, allowedFieldDefs) {
  const allowedKeys = new Set(allowedFieldDefs.map((f) => f.field_key));
  const cleaned = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (allowedKeys.has(k)) cleaned[k] = v;
  }
  const missing = allowedFieldDefs
    .filter((f) => f.is_required)
    .map((f) => f.field_key)
    .filter((k) => cleaned[k] === undefined || cleaned[k] === null || cleaned[k] === '');
  if (missing.length > 0) {
    const err = new Error(`Missing required field(s): ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }
  return cleaned;
}

exports.listPaged = async ({
  authedUser,
  industry_id,
  q,
  page,
  pageSize,
  sortField,
  sortDir,
}) => {
  const user = await resolveActor(authedUser);
  const isSuperAdmin = (user.role || authedUser.role) === 'superAdmin';

  // Tenant isolation: only SuperAdmin may target a different industry.
  let scope_industry = isSuperAdmin ? industry_id || undefined : user.industry_id || undefined;

  // Build a search-key list from the active form fields so quick filter
  // works against whatever the SuperAdmin has actually configured.
  const screen = await screenModel.findByKey(ORG_SCREEN_KEY);
  let searchKeys = [];
  if (screen?.is_active) {
    const fields = await fieldModel.list({ screen_id: screen._id, activeOnly: true });
    searchKeys = fields
      .filter((f) => f.is_table_visible && ['text', 'email', 'textarea'].includes(f.type))
      .map((f) => f.field_key);
  }

  return organizationModel.listPaged({
    industry_id: scope_industry,
    q,
    page,
    pageSize,
    sortField,
    sortDir,
    searchKeys,
  });
};

exports.fetchById = async ({ id, authedUser }) => {
  const user = await resolveActor(authedUser);
  const isSuperAdmin = (user.role || authedUser.role) === 'superAdmin';
  const org = await organizationModel.findById(id);
  if (!org) return null;
  if (!isSuperAdmin && org.industry_id && org.industry_id !== user.industry_id) {
    const err = new Error('Organization not found'); err.status = 404; throw err;
  }
  return org;
};

function generateOrgId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

exports.create = async ({ payload, authedUser }) => {
  const user = await resolveActor(authedUser);
  const isSuperAdmin = (user.role || authedUser.role) === 'superAdmin';

  const industry_id = isSuperAdmin
    ? payload.industry_id || user.industry_id
    : user.industry_id;

  const { fields: allowedFields } = await resolveAllowedFormFields({
    industry_code: industry_id,
    role_key: user.role || authedUser.role,
    isSuperAdmin,
  });
  const cleaned = pickAllowed(payload?.fields ?? payload ?? {}, allowedFields);

  const orgId = generateOrgId();

  const orgDoc = await organizationModel.create({
    ...cleaned,
    organization_id: orgId,
    industry_id,
    is_active: payload.is_active !== false,
    created_by: user._id,
  });

  // Automatically create an Admin user for this organization
  const orgName = cleaned.name || payload.name || 'Organization';
  const orgEmail = cleaned.email || payload.email;
  let adminEmail = orgEmail || `admin@${(cleaned.code || payload.code || 'org').toLowerCase()}.com`;

  // Ensure unique admin email
  const existingUser = await userModel.User.findOne({ email: adminEmail.toLowerCase().trim() });
  if (existingUser) {
    adminEmail = `admin-${Date.now()}@${(cleaned.code || payload.code || 'org').toLowerCase()}.com`;
  }

  await userModel.create({
    name: `${orgName} Admin`,
    email: adminEmail.toLowerCase().trim(),
    password: 'rubix1234',
    role: 'admin',
    industry_id: industry_id,
  });

  return orgDoc;
};

exports.update = async ({ id, payload, authedUser }) => {
  const user = await resolveActor(authedUser);
  const isSuperAdmin = (user.role || authedUser.role) === 'superAdmin';

  const existing = await organizationModel.findById(id);
  if (!existing) {
    const err = new Error('Organization not found'); err.status = 404; throw err;
  }
  if (!isSuperAdmin && existing.industry_id && existing.industry_id !== user.industry_id) {
    const err = new Error('Organization not found'); err.status = 404; throw err;
  }

  const { fields: allowedFields } = await resolveAllowedFormFields({
    industry_code: existing.industry_id,
    role_key: user.role || authedUser.role,
    isSuperAdmin,
  });
  const cleaned = pickAllowed(payload?.fields ?? payload ?? {}, allowedFields);

  const patch = { ...cleaned };
  if (payload.is_active !== undefined) patch.is_active = !!payload.is_active;
  if (isSuperAdmin && payload.industry_id) patch.industry_id = payload.industry_id;

  return organizationModel.update(id, patch);
};

exports.remove = async ({ id, authedUser }) => {
  const user = await resolveActor(authedUser);
  const isSuperAdmin = (user.role || authedUser.role) === 'superAdmin';
  const existing = await organizationModel.findById(id);
  if (!existing) {
    const err = new Error('Organization not found'); err.status = 404; throw err;
  }
  if (!isSuperAdmin && existing.industry_id && existing.industry_id !== user.industry_id) {
    const err = new Error('Organization not found'); err.status = 404; throw err;
  }
  return organizationModel.remove(id);
};
