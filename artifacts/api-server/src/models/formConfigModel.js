const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String },
  type: { type: String },
  required: { type: Boolean, default: false },
  options: { type: [mongoose.Schema.Types.Mixed], default: [] },
  validation: { type: mongoose.Schema.Types.Mixed },
  placeholder: { type: String }
}, { _id: false });

const FormConfigSchema = new mongoose.Schema({
  form_name: { type: String, required: true },
  module: { type: String },
  fields: { type: [FieldSchema], default: [] }
}, { timestamps: true, collection: 'form_configs' });

module.exports = mongoose.model('FormConfig', FormConfigSchema);
