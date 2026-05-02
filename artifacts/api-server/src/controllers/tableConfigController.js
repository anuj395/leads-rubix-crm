const tableConfigService = require('../services/tableConfigService');

// POST /api/table-configs - upsert entire industry config with screens array
exports.upsertIndustry = async (req, res, next) => {
  console.log('Received upsert request with body:', req.body);
  try {
    const { industry_id, screens } = req.body || {};
    const doc = await tableConfigService.upsertIndustry({ industry_id, screens });
    return res.status(200).json({ message: 'Table config saved', industry_id: doc.industry_id, screens: doc.screens });
  } catch (err) {
    next(err);
  }
};

// GET /api/table-configs/:industry_id - return full industry config
exports.getByIndustry = async (req, res, next) => {
  try {
    const { industry_id } = req.params || {};
    const doc = await tableConfigService.getByIndustry(industry_id);
    if (!doc) return res.status(404).json({ message: 'Table config not found' });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};
