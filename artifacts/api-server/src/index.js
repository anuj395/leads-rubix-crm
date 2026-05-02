// src/index.js
// Entry point for the application. Loads config, creates server.
const app = require('./app');
const config = require('./config');
const db = require('./db');
require('./models/userModel'); // ensure User model is registered before seeding
const { seedUsers } = require('./seed');

const PORT = config.port || 3001;

// start database first
(async () => {
  await db.connect();
  try {
    await seedUsers();
  } catch (err) {
    console.error('[seed] failed to seed users:', err.message || err);
  }
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
