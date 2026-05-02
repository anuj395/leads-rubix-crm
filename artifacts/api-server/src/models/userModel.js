// src/models/userModel.js
// mongoose-based user model implementation

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Predefined roles (machine-friendly keys)
exports.ROLES = ['sales', 'teamLead', 'leadManager', 'admin', 'superAdmin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: exports.ROLES, default: 'sales' },
    industry_id: { type: String },
  },
  { timestamps: true },
);

// hash password before save
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

exports.findAll = async () => {
  return User.find().select('-password').lean().exec();
};

exports.findById = async (id) => {
  return User.findById(id).select('-password').lean().exec();
};

exports.findByEmail = async (email) => {
  return User.findOne({ email: String(email).toLowerCase().trim() }).exec();
};

exports.create = async (data) => {
  const user = new User(data);
  await user.save();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    industry_id: user.industry_id,
  };
};
