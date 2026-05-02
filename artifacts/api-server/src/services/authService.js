// src/services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    '[auth] FATAL: JWT_SECRET environment variable must be set in production.',
  );
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const DEFAULT_ROLE = 'sales';

exports.signup = async (email, password, role, industry_id, name) => {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const finalRole = role || DEFAULT_ROLE;
  if (!userModel.ROLES.includes(finalRole)) {
    const err = new Error('Invalid role');
    err.status = 400;
    throw err;
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 400;
    throw err;
  }

  const user = await userModel.create({
    email,
    password,
    role: finalRole,
    industry_id,
    name,
  });

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    industry_id: user.industry_id,
  };
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return { user: safeUser, token };
};

exports.login = async (email, password) => {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    industry_id: user.industry_id,
  };
  return { user: safeUser, token };
};

exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
};
