const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema(
  {
    licensesCost: { type: Number, default: 1000 },
    trialPeriodLicenses: { type: Number, default: 20 },
  },
  { timestamps: true },
);

const PricingPlan = mongoose.model('PricingPlan', pricingPlanSchema, 'pricing_plans');

exports.PricingPlan = PricingPlan;
