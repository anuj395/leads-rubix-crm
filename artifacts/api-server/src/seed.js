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

module.exports = { seedUsers, migrateAndSeedSidebar };
