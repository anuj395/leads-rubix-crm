// src/index.js
// Entry point for the application. Loads config, creates server.
const app = require('./app');
const config = require('./config');
const db = require('./db');

const PORT = config.port || 3001;

// start database first
(async () => {
  await db.connect();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
