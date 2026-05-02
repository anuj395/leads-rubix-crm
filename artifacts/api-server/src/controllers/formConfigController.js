const FormConfig = require('../models/formConfigModel');

const createFormConfig = async (req, res, next) => {
  try {
    const { form_name, module, fields } = req.body;

    if (!form_name || typeof form_name !== 'string') {
      return res.status(400).json({ message: 'form_name is required and must be a string' });
    }
    if (fields && !Array.isArray(fields)) {
      return res.status(400).json({ message: 'fields must be an array' });
    }

    const doc = new FormConfig({ form_name, module, fields: fields || [] });
    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

const getAllFormConfigs = async (req, res, next) => {
  try {
    const docs = await FormConfig.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

const getFormConfigByName = async (req, res, next) => {
  try {
    const { form_name } = req.params;
    const doc = await FormConfig.findOne({ form_name });
    if (!doc) return res.status(404).json({ message: 'Form config not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

const updateFormConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (payload.fields && !Array.isArray(payload.fields)) {
      return res.status(400).json({ message: 'fields must be an array' });
    }

    const updated = await FormConfig.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Form config not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const deleteFormConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const removed = await FormConfig.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'Form config not found' });
    res.json({ message: 'Deleted', id: removed._id });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFormConfig,
  getAllFormConfigs,
  getFormConfigByName,
  updateFormConfig,
  deleteFormConfig
};
