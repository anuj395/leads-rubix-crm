// src/config/index.js
// configuration loader; reads from environment variables or defaults
require('dotenv').config();

module.exports = {
  // use a port that doesn't conflict with a frontend dev server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/leadsrubix-migrate-crm'
  // add other third-party API keys, etc.
};
