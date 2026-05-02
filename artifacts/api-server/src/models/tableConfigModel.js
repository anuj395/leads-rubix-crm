const mongoose = require('mongoose');

// headers are kept flexible to allow dynamic keys per requirement
const screenSchema = new mongoose.Schema({
  screen: { type: String, required: true },
  headers: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { _id: false });

const tableConfigSchema = new mongoose.Schema({
  industry_id: { type: String, required: true, unique: true },
  screens: { type: [screenSchema], default: [] },
}, { timestamps: true });

// collection: table_configs (one document per industry)
const TableConfig = mongoose.model('TableConfig', tableConfigSchema, 'table_configs');

exports.upsertIndustry = async ({ industry_id, screens }) => {
  if (!industry_id) {
    const err = new Error('industry_id is required');
    err.status = 400;
    throw err;
  }

  const safeIndustry = String(industry_id);
  const incomingScreens = Array.isArray(screens) ? screens : [];

  // For each incoming screen: try to update existing screen's headers ($set)
  // If no existing screen matched, push the new screen into the screens array ($push)
  // Use upsert:true for creation when industry document does not exist
  for (const s of incomingScreens) {
    const screenName = String(s.screen || '');
    const headers = Array.isArray(s.headers) ? s.headers : [];

    // First, attempt to update existing screen's headers
    const updateExisting = await TableConfig.updateOne(
      { industry_id: safeIndustry, 'screens.screen': screenName },
      { $set: { 'screens.$.headers': headers }, $currentDate: { updatedAt: true } }
    ).exec();

    const matched = updateExisting && (updateExisting.matchedCount || updateExisting.n || updateExisting.nMatching || updateExisting.nModified || updateExisting.modifiedCount);

    if (!matched) {
      // If not matched, push the new screen only if it doesn't already exist (prevent duplicates)
      await TableConfig.updateOne(
        { industry_id: safeIndustry, 'screens.screen': { $ne: screenName } },
        {
          $push: { screens: { screen: screenName, headers } },
          $setOnInsert: { industry_id: safeIndustry, createdAt: new Date() },
          $currentDate: { updatedAt: true },
        },
        { upsert: true }
      ).exec();
    }
  }

  return TableConfig.findOne({ industry_id: safeIndustry }).lean().exec();
};

exports.findByIndustry = async (industry_id) => {
  if (!industry_id) return null;
  return TableConfig.findOne({ industry_id }).lean().exec();
};

exports.deleteAll = async () => TableConfig.deleteMany({});

module.exports.TableConfig = TableConfig;
