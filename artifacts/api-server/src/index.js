// src/index.js
// Entry point for the application. Loads config, creates server.
const app = require('./app');
const config = require('./config');
const db = require('./db');
require('./models/userModel'); // ensure User model is registered before seeding
require('./models/sidebarModel'); // ensure SidebarConfig model is registered before seeding
const { seedUsers, seedSidebarConfigs } = require('./seed');

const PORT = config.port || 3001;

// start database first
(async () => {
  await db.connect();
  try {
    await seedUsers();
  } catch (err) {
    console.error('[seed] failed to seed users:', err.message || err);
  }
  try {
    await seedSidebarConfigs();
  } catch (err) {
    console.error('[seed] failed to seed sidebar configs:', err.message || err);
  }
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
