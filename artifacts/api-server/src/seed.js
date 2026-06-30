// src/seed.js
// Seeds collections from seed-data on first boot.
// - Idempotent: skips work when target collections already populated.
// - Bypasses pre-save hooks where the source data is already encoded
//   (e.g. bcrypted passwords, EJSON $oid/$date).
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const SEED_FILE = path.join(__dirname, '..', 'seed-data', 'users.json');
const SIDEBAR_SEED_FILE = path.join(__dirname, '..', 'seed-data', 'sidebar_configs.json');
const INDUSTRIES_SEED_FILE = path.join(__dirname, '..', 'seed-data', 'industries.json');
const CONTACTS_SEED_FILE = path.join(__dirname, '..', 'seed-data', 'contacts.json');
const ORGANIZATIONS_SEED_FILE = path.join(__dirname, '..', 'seed-data', 'organizations.json');
const BOOKINGS_SEED_FILE = path.join(__dirname, '..', 'seed-data', 'bookings.json');

const ROLE_DISPLAY_NAMES = {
  superAdmin: 'Super Administrator',
  admin: 'Administrator',
  leadManager: 'Lead Manager',
  teamLead: 'Team Lead',
  sales: 'Sales',
};

function reviveEjson(value) {
  if (Array.isArray(value)) return value.map(reviveEjson);
  if (value && typeof value === 'object') {
    if (typeof value.$oid === 'string') {
      return new mongoose.Types.ObjectId(value.$oid);
    }
    if (typeof value.$date === 'string' || typeof value.$date === 'number') {
      return new Date(value.$date);
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = reviveEjson(v);
    return out;
  }
  return value;
}

function capitalize(s) {
  return String(s || '').replace(/^./, (c) => c.toUpperCase());
}

async function seedUsers() {
  const User = mongoose.model('User');
  const bcrypt = require('bcryptjs');
  const hashedDevPassword = bcrypt.hashSync('rubix1234', 10);

  // Ensure all existing users in the database are updated to password 'rubix1234'
  const list = await User.find({});
  for (const u of list) {
    const match = await bcrypt.compare('rubix1234', u.password);
    if (!match) {
      await User.updateOne({ _id: u._id }, { $set: { password: hashedDevPassword } });
      console.log(`[seed] reset password for user ${u.email} to 'rubix1234'`);
    }
  }

  // Ensure a known dev superAdmin is present — DEV/TEST environments only.
  // In production this is a hard backdoor, so it is gated explicitly.
  if (process.env.NODE_ENV !== 'production') {
    await ensureDevAdmin();
  } else {
    console.log('[seed] NODE_ENV=production — skipping dev superAdmin seed');
  }
}

async function ensureDevAdmin() {
  const User = mongoose.model('User');
  
  // Delete legacy dev superAdmin if exists
  await User.deleteOne({ email: 'dev@rubixcrm.dev' });
  
  const email = 'info@leadsrubix.com';
  const existing = await User.findOne({ email }).exec();
  
  // Hash password using bcrypt if updating directly, or save new user
  if (existing) {
    existing.name = 'Dev Super Admin';
    existing.password = 'lead@1221';
    existing.role = 'superAdmin';
    existing.industry_id = 'temp0001';
    await existing.save();
    console.log(`[seed] updated single superAdmin: ${email}`);
    return;
  }

  const dev = new User({
    name: 'Dev Super Admin',
    email,
    password: 'lead@1221',
    role: 'superAdmin',
    industry_id: 'temp0001',
  });
  await dev.save();
  console.log(`[seed] created single superAdmin: ${email} / lead@1221`);
}

/**
 * Migrates legacy `sidebar_configs` data (or seed JSON if no legacy data
 * present) into the normalized `industries`, `roles`, `sidebar_menus`,
 * `sidebar_permissions` collections, and drops the legacy collection.
 *
 * Idempotent — runs only when the `industries` collection is empty.
 */
async function migrateAndSeedSidebar() {
  const Industry = mongoose.model('Industry');
  const Role = mongoose.model('Role');
  const SidebarMenu = mongoose.model('SidebarMenu');
  const SidebarPermission = mongoose.model('SidebarPermission');

  const industryCount = await Industry.estimatedDocumentCount();
  if (industryCount > 0) {
    console.log(
      `[seed] industries already populated (${industryCount}) — skipping sidebar migration`,
    );
    return;
  }

  // Source 1: legacy sidebar_configs collection
  let sources = [];
  try {
    const collections = await mongoose.connection.db
      .listCollections({ name: 'sidebar_configs' })
      .toArray();
    if (collections.length) {
      const docs = await mongoose.connection.db
        .collection('sidebar_configs')
        .find({})
        .toArray();
      if (docs.length) sources = docs;
    }
  } catch (e) {
    /* swallow — collection may not exist */
  }

  // Source 2: seed JSON file (used on a fresh in-memory DB)
  if (!sources.length && fs.existsSync(SIDEBAR_SEED_FILE)) {
    const raw = JSON.parse(fs.readFileSync(SIDEBAR_SEED_FILE, 'utf8'));
    sources = (Array.isArray(raw) ? raw : [raw]).map(reviveEjson);
  }

  if (!sources.length) {
    console.log('[seed] no legacy sidebar data found — skipping migration');
    return;
  }

  let menuCount = 0;
  let permCount = 0;

  for (const src of sources) {
    const industryCode = String(src.industry_id || 'default').toLowerCase().trim();

    // Industry
    const industry = await Industry.findOneAndUpdate(
      { code: industryCode },
      { $setOnInsert: { code: industryCode, name: industryCode, is_active: true } },
      { upsert: true, new: true },
    );

    const rolesObj = src.roles || {};
    for (const [roleKey, menuList] of Object.entries(rolesObj)) {
      // Role
      const role = await Role.findOneAndUpdate(
        { industry_id: industry._id, key: roleKey },
        {
          $setOnInsert: {
            industry_id: industry._id,
            key: roleKey,
            name: ROLE_DISPLAY_NAMES[roleKey] || roleKey,
            is_active: true,
          },
        },
        { upsert: true, new: true },
      );

      // Menus + permissions
      const arr = Array.isArray(menuList) ? menuList : [];
      for (let i = 0; i < arr.length; i++) {
        const m = arr[i];
        if (!m || !m.key || !m.name) continue;

        const isChild = String(m.key).includes('.');
        const moduleKey = String(
          m.module || (isChild ? m.key.split('.')[0] : m.key),
        ).toLowerCase();

        let parentId = null;
        if (isChild) {
          const parent = await SidebarMenu.findOneAndUpdate(
            { key: moduleKey },
            {
              $setOnInsert: {
                key: moduleKey,
                name: capitalize(moduleKey),
                icon: moduleKey,
                module: moduleKey,
                parent_id: null,
                order: 0,
                is_active: true,
              },
            },
            { upsert: true, new: true },
          );
          parentId = parent._id;
          menuCount++;
        }

        const menu = await SidebarMenu.findOneAndUpdate(
          { key: m.key },
          {
            $setOnInsert: {
              key: m.key,
              name: m.name,
              icon: m.icon || '',
              route: m.route || '',
              parent_id: parentId,
              module: moduleKey,
              order: i,
              is_active: true,
            },
          },
          { upsert: true, new: true },
        );
        menuCount++;

        await SidebarPermission.updateOne(
          { role_id: role._id, industry_id: industry._id, menu_id: menu._id },
          {
            $set: { is_visible: true, order_override: i },
            $setOnInsert: {
              role_id: role._id,
              industry_id: industry._id,
              menu_id: menu._id,
            },
          },
          { upsert: true },
        );
        permCount++;
      }
    }
  }

  // Drop legacy collection so we don't accidentally read from it again.
  try {
    const legacy = await mongoose.connection.db
      .listCollections({ name: 'sidebar_configs' })
      .toArray();
    if (legacy.length) {
      await mongoose.connection.db.dropCollection('sidebar_configs');
      console.log('[seed] dropped legacy sidebar_configs collection');
    }
  } catch (e) {
    /* ignore */
  }

  console.log(
    `[seed] sidebar migration complete: ${menuCount} menu refs, ${permCount} permissions`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen / field / permission seed
// ─────────────────────────────────────────────────────────────────────────────

const SCREEN_DEFAULTS = [
  {
    key: 'contacts',
    name: 'Contacts',
    description: 'Customer / lead contact list',
    fields: [
      { field_key: 'customer_name', label: 'Name',      type: 'text',  is_required: true,  order: 1 },
      { field_key: 'email',         label: 'Email',     type: 'email', is_required: false, order: 2 },
      { field_key: 'contact_no',    label: 'Phone',     type: 'text',  is_required: false, order: 3 },
      { field_key: 'status',        label: 'Status',    type: 'badge', is_required: false, order: 4 },
      { field_key: 'lead_type',     label: 'Lead Type', type: 'select', is_required: false, order: 5,
        dropdown_source: 'api', dropdown_api: '/api/options/lead-types' },
      { field_key: 'project',       label: 'Project',   type: 'select', is_required: false, order: 6,
        dropdown_source: 'api', dropdown_api: '/api/options/projects' },
    ],
  },
  {
    key: 'tasks',
    name: 'Tasks',
    description: 'Lead / follow-up tasks',
    fields: [
      { field_key: 'task_type',     label: 'Type',          type: 'text',  is_required: true,  order: 1 },
      { field_key: 'status',        label: 'Status',        type: 'badge', is_required: false, order: 2 },
      { field_key: 'assigned_to',   label: 'Assigned To',   type: 'text',  is_required: false, order: 3 },
      { field_key: 'next_follow_up',label: 'Next Follow-up',type: 'date',  is_required: false, order: 4 },
      { field_key: 'notes',         label: 'Notes',         type: 'textarea', is_required: false, order: 5 },
    ],
  },
  {
    key: 'users',
    name: 'Users',
    description: 'Per-role custom fields shown on the Add/Edit User form',
    fields: [
      { field_key: 'phone',         label: 'Phone',         type: 'text',   is_required: false, order: 1 },
      { field_key: 'employee_id',   label: 'Employee ID',   type: 'text',   is_required: false, order: 2 },
      { field_key: 'department',    label: 'Department',    type: 'select', is_required: false, order: 3,
        dropdown_source: 'api', dropdown_api: '/api/options/departments' },
      { field_key: 'designation',   label: 'Designation',   type: 'select', is_required: false, order: 4,
        dropdown_source: 'api', dropdown_api: '/api/options/designations' },
      { field_key: 'joining_date',  label: 'Joining Date',  type: 'date',   is_required: false, order: 5 },
    ],
  },
  {
    key: 'organization',
    name: 'Organization',
    description: 'Organization records — fully dynamic table & form',
    fields: [
      { field_key: 'organization_name', label: 'Organization Name', type: 'text', is_required: true, order: 1 },
      { field_key: 'first_name',    label: 'First Name',    type: 'text',     is_required: false, order: 2 },
      { field_key: 'last_name',     label: 'Last Name',     type: 'text',     is_required: false, order: 3 },
      { field_key: 'contact_no',    label: 'Contact Number', type: 'phone',    is_required: true,  order: 4 },
      { field_key: 'email_id',      label: 'Email ID',      type: 'email',    is_required: false, order: 5 },
      { field_key: 'country',       label: 'Country',       type: 'select',   is_required: true,  order: 6,
        dropdown_source: 'api', dropdown_api: '/api/options/countries' },
      { field_key: 'state',         label: 'State',         type: 'select',   is_required: true,  order: 7,
        dropdown_source: 'api', dropdown_api: '/api/options/states' },
      { field_key: 'city',          label: 'City',          type: 'text',     is_required: true,  order: 8 },
      { field_key: 'pincode',       label: 'Pincode',       type: 'text',     is_required: false, order: 9 },
      { field_key: 'industry_id',   label: 'Industry ID',   type: 'select',   is_required: true,  order: 10,
        dropdown_source: 'api', dropdown_api: '/api/options/industries' },
      { field_key: 'num_employees', label: 'Number of Employees', type: 'number', is_required: false, order: 11 },
      { field_key: 'address',       label: 'Address',       type: 'textarea', is_required: false, order: 12 },
      { field_key: 'allowDuplicateLeads', label: 'Allow Duplicate Leads', type: 'checkbox', is_form_visible: false, default_value: true, order: 13 },
      { field_key: 'showAnalytics', label: 'Show Analytics', type: 'checkbox', is_form_visible: false, default_value: true, order: 14 },
      { field_key: 'showData', label: 'Show Data', type: 'checkbox', is_form_visible: false, is_table_visible: false, default_value: true, order: 15 },
      { field_key: 'trialPeriod', label: 'Trial Period', type: 'checkbox', is_form_visible: false, is_table_visible: false, default_value: true, order: 16 },
      { field_key: 'designations', label: 'Designations', type: 'text', is_form_visible: false, is_table_visible: false, default_value: [], order: 17 },
      { field_key: 'teams', label: 'Teams', type: 'text', is_form_visible: false, is_table_visible: false, default_value: [], order: 18 },
      { field_key: 'status', label: 'Status', type: 'text', is_form_visible: false, default_value: 'ACTIVE', order: 19 },
    ],
  },
  {
    key: 'bookings',
    name: 'Bookings',
    description: 'Customer booking records — fully dynamic table & form',
    fields: [
      { field_key: 'customer_name', label: 'Customer Name', type: 'text',     is_required: true,  order: 1 },
      { field_key: 'contact_no',    label: 'Phone Number',  type: 'text',     is_required: false, order: 2 },
      { field_key: 'project',       label: 'Project Name',  type: 'text',     is_required: false, order: 3 },
      { field_key: 'location',      label: 'Location',      type: 'text',     is_required: false, order: 4 },
      { field_key: 'branch',        label: 'Branch',        type: 'text',     is_required: false, order: 5 },
      { field_key: 'team',          label: 'Assigned Team',  type: 'text',     is_required: false, order: 6 },
    ],
  },
];

async function seedScreens() {
  const Screen = mongoose.model('Screen');
  const ScreenField = mongoose.model('ScreenField');
  const ScreenPermission = mongoose.model('ScreenPermission');
  const Industry = mongoose.model('Industry');
  const Role = mongoose.model('Role');

  // Note: this seeder is fully idempotent (every write is an upsert), so we
  // intentionally re-run it on every boot instead of short-circuiting on a
  // non-empty `screens` collection. That way new screens added to
  // SCREEN_DEFAULTS (e.g. `organization`) get installed without dropping the DB.

  // Upsert screens + fields.
  const fieldsByScreen = new Map();
  for (const spec of SCREEN_DEFAULTS) {
    const screen = await Screen.findOneAndUpdate(
      { key: spec.key },
      { $set: { name: spec.name, description: spec.description, is_active: true } },
      { upsert: true, new: true },
    );
    const fieldDocs = [];
    for (const f of spec.fields) {
      const doc = await ScreenField.findOneAndUpdate(
        { screen_id: screen._id, field_key: f.field_key },
        {
          $set: {
            label: f.label,
            type: f.type,
            is_table_visible: f.is_table_visible !== false,
            is_form_visible: f.is_form_visible !== false,
            is_required: !!f.is_required,
            sortable: true,
            order: f.order || 0,
            is_active: true,
            dropdown_source: f.dropdown_source || 'none',
            dropdown_api: f.dropdown_api || '',
            default_value: f.default_value !== undefined ? f.default_value : null,
          },
          $setOnInsert: { screen_id: screen._id, field_key: f.field_key },
        },
        { upsert: true, new: true },
      );
      fieldDocs.push(doc);
    }
    // Clean up any fields that are no longer in the spec.
    const specKeys = spec.fields.map((f) => f.field_key);
    await ScreenField.deleteMany({ screen_id: screen._id, field_key: { $nin: specKeys } });
    fieldsByScreen.set(String(screen._id), { screen, fields: fieldDocs });
  }

  // Enable all fields for every (industry × role) combo we know about, so the
  // existing ContactsList / TasksList pages have data out of the box.
  const industries = await Industry.find({ is_active: true }).lean().exec();
  const roles = await Role.find({ is_active: true }).lean().exec();

  let permCount = 0;
  for (const [, { screen, fields }] of fieldsByScreen) {
    for (const industry of industries) {
      const industryRoles = roles.filter((r) => String(r.industry_id) === String(industry._id));
      for (const role of industryRoles) {
        for (const field of fields) {
          await ScreenPermission.updateOne(
            {
              screen_id: screen._id,
              role_id: role._id,
              industry_id: industry._id,
              field_id: field._id,
            },
            {
              $set: { is_enabled: true },
              $setOnInsert: {
                screen_id: screen._id,
                role_id: role._id,
                industry_id: industry._id,
                field_id: field._id,
              },
            },
            { upsert: true },
          );
          permCount += 1;
        }
      }
    }
  }

  console.log(
    `[seed] screens seeded: ${SCREEN_DEFAULTS.length} screens, ${permCount} permission rows`,
  );
}

/**
 * Upserts the curated industry list from `seed-data/industries.json`.
 *
 * - Inserts any missing entries (matched by `code` = lowercased seed `id`).
 * - Refreshes `name` on existing rows so display names stay in sync with the
 *   curated list, but never flips `is_active` (admins may have disabled one).
 * - Always runs on boot — it's a no-op once the rows already match.
 */
async function seedIndustries() {
  if (!fs.existsSync(INDUSTRIES_SEED_FILE)) {
    console.log('[seed] no seed-data/industries.json found — skipping industry seed');
    return;
  }
  const Industry = mongoose.model('Industry');
  const Role = mongoose.model('Role');
  const raw = JSON.parse(fs.readFileSync(INDUSTRIES_SEED_FILE, 'utf8'));
  const entries = Array.isArray(raw) ? raw : [];

  let inserted = 0;
  let updated = 0;
  for (const { id, name } of entries) {
    if (!id || !name) continue;
    const code = String(id).toLowerCase().trim();
    const result = await Industry.findOneAndUpdate(
      { code },
      {
        $set: { name: String(name) },
        $setOnInsert: { code, is_active: true },
      },
      { upsert: true, new: false, includeResultMetadata: true },
    );
    if (!result?.lastErrorObject?.updatedExisting) inserted += 1;
    else updated += 1;
  }
  console.log(
    `[seed] industries: ${inserted} inserted, ${updated} refreshed (from seed-data/industries.json)`,
  );

  // Make sure every industry has the default tenant-scoped roles. Without
  // these, dynamic-form resolve calls 404 the moment an admin tries to add a
  // user under a freshly-seeded industry. `superAdmin` is intentionally NOT
  // a per-industry role — it's handled as a system-wide bypass.
  const DEFAULT_ROLES = ['admin', 'leadManager', 'teamLead', 'sales'];
  const allIndustries = await Industry.find({}).lean().exec();
  let rolesAdded = 0;
  for (const ind of allIndustries) {
    for (const key of DEFAULT_ROLES) {
      const r = await Role.findOneAndUpdate(
        { industry_id: ind._id, key },
        {
          $setOnInsert: {
            industry_id: ind._id,
            key,
            name: ROLE_DISPLAY_NAMES[key] || capitalize(key),
            is_active: true,
          },
        },
        { upsert: true, new: false, includeResultMetadata: true },
      );
      if (!r?.lastErrorObject?.updatedExisting) rolesAdded += 1;
    }
  }
  if (rolesAdded > 0) {
    console.log(`[seed] roles: ${rolesAdded} default role(s) inserted across industries`);
  }
}

async function seedContacts() {
  // Skip seeding contacts to rely solely on user-driven DB data
}

async function seedOrganizations() {
  // Skip seeding organizations to rely solely on user-driven DB data
}

async function seedBookings() {
  // Skip seeding bookings to rely solely on user-driven DB data
}

async function fixIntegrationsSidebar() {
  const SidebarMenu = mongoose.model('SidebarMenu');
  
  // 1. Rename integrations.api_list to integrations.api
  const apiListMenu = await SidebarMenu.findOne({ key: 'integrations.api_list' });
  if (apiListMenu) {
    const existingApi = await SidebarMenu.findOne({ key: 'integrations.api' });
    if (!existingApi) {
      await SidebarMenu.updateOne(
        { _id: apiListMenu._id },
        { 
          $set: { 
            key: 'integrations.api',
            route: '/integrations/api',
            name: 'API List',
            icon: 'api'
          } 
        }
      );
      console.log('[seed] migrated integrations.api_list to integrations.api');
    } else {
      await SidebarMenu.deleteOne({ _id: apiListMenu._id });
      console.log('[seed] deleted redundant integrations.api_list');
    }
  }

  // 2. Rename integrations.api_data to integrations.apiData
  const apiDataMenu = await SidebarMenu.findOne({ key: 'integrations.api_data' });
  if (apiDataMenu) {
    const existingApiData = await SidebarMenu.findOne({ key: 'integrations.apiData' });
    if (!existingApiData) {
      await SidebarMenu.updateOne(
        { _id: apiDataMenu._id },
        { 
          $set: { 
            key: 'integrations.apiData',
            route: '/integrations/api-data',
            name: 'API Data',
            icon: 'apiData'
          } 
        }
      );
      console.log('[seed] migrated integrations.api_data to integrations.apiData');
    } else {
      await SidebarMenu.deleteOne({ _id: apiDataMenu._id });
      console.log('[seed] deleted redundant integrations.api_data');
    }
  }

  // 3. Ensure integrations.integrations is updated
  const mainIntegrations = await SidebarMenu.findOne({ key: 'integrations.integrations' });
  if (mainIntegrations) {
    await SidebarMenu.updateOne(
      { _id: mainIntegrations._id },
      { 
        $set: { 
          route: '/integrations',
          name: 'Integrations',
          icon: 'integrations'
        } 
      }
    );
    console.log('[seed] verified integrations.integrations route and configuration');
  }

  // 4. Double check routes
  const apiMenu = await SidebarMenu.findOne({ key: 'integrations.api' });
  if (apiMenu && apiMenu.route !== '/integrations/api') {
    await SidebarMenu.updateOne({ _id: apiMenu._id }, { $set: { route: '/integrations/api', icon: 'api', name: 'API List' } });
    console.log('[seed] corrected route for integrations.api to /integrations/api');
  }

  const apiDataDoc = await SidebarMenu.findOne({ key: 'integrations.apiData' });
  if (apiDataDoc && apiDataDoc.route !== '/integrations/api-data') {
    await SidebarMenu.updateOne({ _id: apiDataDoc._id }, { $set: { route: '/integrations/api-data', icon: 'apiData', name: 'API Data' } });
    console.log('[seed] corrected route for integrations.apiData to /integrations/api-data');
  }
}

const DROPDOWN_OPTION_DEFAULTS = {
  'lead-types': [
    { value: 'hot',  label: 'Hot' },
    { value: 'warm', label: 'Warm' },
    { value: 'cold', label: 'Cold' },
  ],
  'lead-statuses': [
    { value: 'new',         label: 'New' },
    { value: 'contacted',   label: 'Contacted' },
    { value: 'qualified',   label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'converted',   label: 'Converted' },
  ],
  'projects': [
    { value: 'gateway',  label: 'Gateway Towers' },
    { value: 'horizon',  label: 'Horizon Heights' },
    { value: 'meadow',   label: 'Meadow Greens' },
  ],
  'departments': [
    { value: 'sales',       label: 'Sales' },
    { value: 'marketing',   label: 'Marketing' },
    { value: 'support',     label: 'Customer Support' },
    { value: 'operations',  label: 'Operations' },
    { value: 'finance',     label: 'Finance' },
    { value: 'engineering', label: 'Engineering' },
  ],
  'designations': [
    { value: 'executive',  label: 'Executive' },
    { value: 'sr_executive', label: 'Sr. Executive' },
    { value: 'manager',    label: 'Manager' },
    { value: 'sr_manager', label: 'Sr. Manager' },
    { value: 'lead',       label: 'Team Lead' },
    { value: 'director',   label: 'Director' },
  ],
  'countries': [
    { value: 'India', label: 'India' },
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
    { value: 'United Arab Emirates', label: 'United Arab Emirates' },
    { value: 'Singapore', label: 'Singapore' },
    { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  ],
  'states_India': [
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
    { value: 'Assam', label: 'Assam' },
    { value: 'Bihar', label: 'Bihar' },
    { value: 'Chhattisgarh', label: 'Chhattisgarh' },
    { value: 'Goa', label: 'Goa' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Haryana', label: 'Haryana' },
    { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
    { value: 'Jharkhand', label: 'Jharkhand' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Kerala', label: 'Kerala' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Manipur', label: 'Manipur' },
    { value: 'Meghalaya', label: 'Meghalaya' },
    { value: 'Mizoram', label: 'Mizoram' },
    { value: 'Nagaland', label: 'Nagaland' },
    { value: 'Odisha', label: 'Odisha' },
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Sikkim', label: 'Sikkim' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Telangana', label: 'Telangana' },
    { value: 'Tripura', label: 'Tripura' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'Uttarakhand', label: 'Uttarakhand' },
    { value: 'West Bengal', label: 'West Bengal' },
    { value: 'Delhi', label: 'Delhi' },
  ],
  'states_United States': [
    { value: 'Alabama', label: 'Alabama' },
    { value: 'Alaska', label: 'Alaska' },
    { value: 'Arizona', label: 'Arizona' },
    { value: 'Arkansas', label: 'Arkansas' },
    { value: 'California', label: 'California' },
    { value: 'Colorado', label: 'Colorado' },
    { value: 'Connecticut', label: 'Connecticut' },
    { value: 'Delaware', label: 'Delaware' },
    { value: 'Florida', label: 'Florida' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Hawaii', label: 'Hawaii' },
    { value: 'Idaho', label: 'Idaho' },
    { value: 'Illinois', label: 'Illinois' },
    { value: 'Indiana', label: 'Indiana' },
    { value: 'Iowa', label: 'Iowa' },
    { value: 'Kansas', label: 'Kansas' },
    { value: 'Kentucky', label: 'Kentucky' },
    { value: 'Louisiana', label: 'Louisiana' },
    { value: 'Maine', label: 'Maine' },
    { value: 'Maryland', label: 'Maryland' },
    { value: 'Massachusetts', label: 'Massachusetts' },
    { value: 'Michigan', label: 'Michigan' },
    { value: 'Minnesota', label: 'Minnesota' },
    { value: 'Mississippi', label: 'Mississippi' },
    { value: 'Missouri', label: 'Missouri' },
    { value: 'Montana', label: 'Montana' },
    { value: 'Nebraska', label: 'Nebraska' },
    { value: 'Nevada', label: 'Nevada' },
    { value: 'New Hampshire', label: 'New Hampshire' },
    { value: 'New Jersey', label: 'New Jersey' },
    { value: 'New Mexico', label: 'New Mexico' },
    { value: 'New York', label: 'New York' },
    { value: 'North Carolina', label: 'North Carolina' },
    { value: 'North Dakota', label: 'North Dakota' },
    { value: 'Ohio', label: 'Ohio' },
    { value: 'Oklahoma', label: 'Oklahoma' },
    { value: 'Oregon', label: 'Oregon' },
    { value: 'Pennsylvania', label: 'Pennsylvania' },
    { value: 'Rhode Island', label: 'Rhode Island' },
    { value: 'South Carolina', label: 'South Carolina' },
    { value: 'South Dakota', label: 'South Dakota' },
    { value: 'Tennessee', label: 'Tennessee' },
    { value: 'Texas', label: 'Texas' },
    { value: 'Utah', label: 'Utah' },
    { value: 'Vermont', label: 'Vermont' },
    { value: 'Virginia', label: 'Virginia' },
    { value: 'Washington', label: 'Washington' },
    { value: 'West Virginia', label: 'West Virginia' },
    { value: 'Wisconsin', label: 'Wisconsin' },
    { value: 'Wyoming', label: 'Wyoming' },
  ],
  'country_codes': [
    { value: '+91', label: '🇮🇳 India (+91)' },
    { value: '+1', label: '🇺🇸 United States (+1)' },
    { value: '+44', label: '🇬🇧 United Kingdom (+44)' },
    { value: '+971', label: '🇦🇪 UAE (+971)' },
    { value: '+65', label: '🇸🇬 Singapore (+65)' },
    { value: '+61', label: '🇦🇺 Australia (+61)' },
    { value: '+966', label: '🇸🇦 Saudi Arabia (+966)' },
    { value: '+974', label: '🇶🇦 Qatar (+974)' },
    { value: '+965', label: '🇰🇼 Kuwait (+965)' },
    { value: '+968', label: '🇴🇲 Oman (+968)' },
    { value: '+973', label: '🇧🇭 Bahrain (+973)' },
  ]
};

async function seedDropdownOptions() {
  const DropdownOption = mongoose.model('DropdownOption');
  const count = await DropdownOption.estimatedDocumentCount();
  if (count === 0) {
    console.log('[seed] seeding database-driven dropdown options...');
    for (const [key, options] of Object.entries(DROPDOWN_OPTION_DEFAULTS)) {
      for (const opt of options) {
        await DropdownOption.updateOne(
          { key, value: opt.value },
          { $set: { label: opt.label } },
          { upsert: true }
        );
      }
    }
    console.log('[seed] finished seeding dropdown options.');
  } else {
    console.log('[seed] dropdown_options already populated — skipping seed');
  }
}

module.exports = {
  seedUsers,
  migrateAndSeedSidebar,
  seedScreens,
  seedIndustries,
  seedContacts,
  seedOrganizations,
  seedBookings,
  fixIntegrationsSidebar,
  seedDropdownOptions,
};
