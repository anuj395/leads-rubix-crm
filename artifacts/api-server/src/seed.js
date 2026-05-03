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
  const existing = await User.estimatedDocumentCount();

  if (existing > 0) {
    console.log(`[seed] users collection already has ${existing} doc(s) — skipping bulk seed`);
  } else if (fs.existsSync(SEED_FILE)) {
    const raw = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    const docs = (Array.isArray(raw) ? raw : [raw]).map(reviveEjson);
    // Use the native collection to bypass the schema's pre('save') hook,
    // which would otherwise re-hash the already-hashed passwords.
    const result = await User.collection.insertMany(docs, { ordered: false });
    console.log(`[seed] inserted ${result.insertedCount} user(s) from seed-data/users.json`);
  } else {
    console.log('[seed] no seed-data/users.json found — skipping bulk user seed');
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
  const email = 'dev@rubixcrm.dev';
  const existing = await User.findOne({ email }).exec();
  if (existing) return;

  // Goes through the pre-save hook → password gets bcrypt-hashed.
  const dev = new User({
    name: 'Dev Super Admin',
    email,
    password: 'rubix1234',
    role: 'superAdmin',
    industry_id: 'temp001',
  });
  await dev.save();
  console.log(`[seed] created dev superAdmin: ${email} / rubix1234`);
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
];

async function seedScreens() {
  const Screen = mongoose.model('Screen');
  const ScreenField = mongoose.model('ScreenField');
  const ScreenPermission = mongoose.model('ScreenPermission');
  const Industry = mongoose.model('Industry');
  const Role = mongoose.model('Role');

  const existing = await Screen.estimatedDocumentCount();
  if (existing > 0) {
    console.log(`[seed] screens already populated (${existing}) — skipping screen seed`);
    return;
  }

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
            is_table_visible: true,
            is_form_visible: true,
            is_required: !!f.is_required,
            sortable: true,
            order: f.order || 0,
            is_active: true,
            dropdown_source: f.dropdown_source || 'none',
            dropdown_api: f.dropdown_api || '',
          },
          $setOnInsert: { screen_id: screen._id, field_key: f.field_key },
        },
        { upsert: true, new: true },
      );
      fieldDocs.push(doc);
    }
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

module.exports = { seedUsers, migrateAndSeedSidebar, seedScreens, seedIndustries };
