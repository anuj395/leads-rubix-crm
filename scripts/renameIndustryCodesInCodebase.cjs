// scripts/renameIndustryCodesInCodebase.cjs
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const mapping = {
  'temp0001': 'temp0001',
  'temp0002': 'temp0002',
  'temp0003': 'temp0003',
  'temp0004': 'temp0004',
  'temp0005': 'temp0005',
  'temp0006': 'temp0006',
  'temp0007': 'temp0007',
  'temp0008': 'temp0008',
  'temp0009': 'temp0009',
  'temp0010': 'temp0010',
  'temp0011': 'temp0011',
  'temp0012': 'temp0012',
};

// 1. File replacement
function walkAndReplace(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git' || file === '.local' || file === '.gemini' || file === 'scratch' || file === 'attached_assets') {
        continue;
      }
      walkAndReplace(filePath);
    } else {
      const ext = path.extname(file);
      if (['.js', '.ts', '.tsx', '.json', '.cjs', '.mjs'].includes(ext)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        for (const [oldCode, newCode] of Object.entries(mapping)) {
          if (content.includes(oldCode)) {
            // Regex boundary check or simple replace since they are specific IDs
            const regex = new RegExp(oldCode, 'g');
            content = content.replace(regex, newCode);
            changed = true;
          }
        }
        if (changed) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`[files] Updated codes in: ${filePath}`);
        }
      }
    }
  }
}

// 2. Database migration
async function migrateDatabase() {
  const mongoUri = 'mongodb://localhost:27017/leadsrubix-migrate-crm';
  console.log('[db] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('[db] Connected.');

  const db = mongoose.connection.db;

  // We will update 'code' in industries
  const industriesCol = db.collection('industries');
  for (const [oldCode, newCode] of Object.entries(mapping)) {
    const res = await industriesCol.updateMany({ code: oldCode }, { $set: { code: newCode } });
    if (res.modifiedCount > 0) {
      console.log(`[db] Updated industry code ${oldCode} -> ${newCode} (${res.modifiedCount} updated)`);
    }
  }

  // We will update 'industry_id' (string) in other collections
  const collections = ['users', 'organizations', 'contacts', 'bookings'];
  for (const name of collections) {
    const col = db.collection(name);
    for (const [oldCode, newCode] of Object.entries(mapping)) {
      const res = await col.updateMany({ industry_id: oldCode }, { $set: { industry_id: newCode } });
      if (res.modifiedCount > 0) {
        console.log(`[db] Updated industry_id in ${name}: ${oldCode} -> ${newCode} (${res.modifiedCount} updated)`);
      }
    }
  }

  console.log('[db] Database migration done.');
  await mongoose.disconnect();
}

async function main() {
  console.log('--- Starting Industry Code Migration ---');
  walkAndReplace(path.join(__dirname, '..'));
  await migrateDatabase();
  console.log('--- Migration Completed ---');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
