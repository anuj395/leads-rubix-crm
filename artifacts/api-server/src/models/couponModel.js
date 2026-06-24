const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['Percentage', 'Fixed Amount'], required: true },
    discountValue: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Expired', 'Disabled'], default: 'Active' },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 100 },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Coupon = mongoose.model('Coupon', couponSchema, 'coupons');

exports.Coupon = Coupon;
