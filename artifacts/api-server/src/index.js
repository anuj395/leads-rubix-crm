// src/index.js
// Entry point for the application. Loads config, creates server.
const app = require('./app');
const config = require('./config');
const db = require('./db');

// Register all models before seeding / migrations
require('./models/userModel');
require('./models/industryModel');
require('./models/roleModel');
require('./models/sidebarMenuModel');
require('./models/sidebarPermissionModel');

const { seedUsers, migrateAndSeedSidebar } = require('./seed');

const PORT = config.port || 3001;

(async () => {
  await db.connect();

  try {
    await seedUsers();
  } catch (err) {
    console.error('[seed] failed to seed users:', err.message || err);
  }

  try {
    await migrateAndSeedSidebar();
  } catch (err) {
    console.error('[seed] failed to migrate/seed sidebar:', err.message || err);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
