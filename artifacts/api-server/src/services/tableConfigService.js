const tableConfigModel = require('../models/tableConfigModel');

exports.upsertIndustry = async ({ industry_id, screens }) => {
  if (!industry_id) {
    const err = new Error('industry_id is required');
    err.status = 400;
    throw err;
  }
  const doc = await tableConfigModel.upsertIndustry({ industry_id, screens });
  return doc;
};

exports.getByIndustry = async (industry_id) => {
  if (!industry_id) {
    const err = new Error('industry_id is required');
    err.status = 400;
    throw err;
  }
  return tableConfigModel.findByIndustry(industry_id);
};
