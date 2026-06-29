const mongoose = require('mongoose');

const apiTokenSchema = new mongoose.Schema(
  {
    api_key: { type: String, required: true, unique: true },
    organization_id: { type: String, required: true },
    source: { type: String, required: true }, // e.g. "Webhook", "Facebook"
    leadSource_id: { type: String, default: null }, // camelCase matching Firebase
    country_code: { type: String, default: '+91' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const ApiToken = mongoose.model('ApiToken', apiTokenSchema, 'apiTokens');

module.exports = ApiToken;
