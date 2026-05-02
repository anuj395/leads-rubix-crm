// src/seed.js
// Seeds the User collection from seed-data/users.json on first boot.
// - Idempotent: skips seeding when the collection already has users.
// - Bypasses the password-hashing pre-save hook so already-bcrypted
//   passwords from a Mongo dump are inserted verbatim.
// - Converts EJSON-style {$oid, $date} fields into native BSON / Date.
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const SEED_FILE = path.join(__dirname, '..', 'seed-data', 'users.json');
const SIDEBAR_SEED_FILE = path.join(__dirname, '..', 'seed-data', 'sidebar_configs.json');

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

async function seedUsers() {
  if (!fs.existsSync(SEED_FILE)) {
    console.log('[seed] no seed-data/users.json found — skipping');
    return;
  }

  const User = mongoose.model('User');
  const existing = await User.estimatedDocumentCount();
  if (existing > 0) {
    console.log(`[seed] users collection already has ${existing} doc(s) — skipping seed`);
    return;
  }

  const raw = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const docs = (Array.isArray(raw) ? raw : [raw]).map(reviveEjson);

  // Use the native collection to bypass the schema's pre('save') hook,
  // which would otherwise re-hash the already-hashed passwords.
  const result = await User.collection.insertMany(docs, { ordered: false });
  console.log(`[seed] inserted ${result.insertedCount} user(s) from seed-data/users.json`);
}

async function seedSidebarConfigs() {
  if (!fs.existsSync(SIDEBAR_SEED_FILE)) {
    console.log('[seed] no seed-data/sidebar_configs.json found — skipping');
    return;
  }

  const SidebarConfig = mongoose.model('SidebarConfig');
  const existing = await SidebarConfig.estimatedDocumentCount();
  if (existing > 0) {
    console.log(`[seed] sidebar_configs already has ${existing} doc(s) — skipping seed`);
    return;
  }

  const raw = JSON.parse(fs.readFileSync(SIDEBAR_SEED_FILE, 'utf8'));
  const docs = (Array.isArray(raw) ? raw : [raw]).map(reviveEjson);

  const result = await SidebarConfig.collection.insertMany(docs, { ordered: false });
  console.log(`[seed] inserted ${result.insertedCount} sidebar config(s) from seed-data/sidebar_configs.json`);
}

module.exports = { seedUsers, seedSidebarConfigs };
