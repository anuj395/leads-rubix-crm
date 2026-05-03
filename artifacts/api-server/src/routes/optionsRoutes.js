const express = require('express');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * Demo dropdown sources for the dynamic-form system.
 * Real deployments will replace these with project-specific endpoints; the
 * frontend only cares about the response shape: an array of `{ value, label }`
 * (or plain strings, which the form treats as `value === label`).
 */
const SOURCES = {
  'lead-types':    [
    { value: 'hot',  label: 'Hot' },
    { value: 'warm', label: 'Warm' },
    { value: 'cold', label: 'Cold' },
  ],
  'lead-statuses': [
    { value: 'new',         label: 'New' },
    { value: 'contacted',   label: 'Contacted' },
    { value: 'qualified',   label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'converted',   label: 'Converted' },
  ],
  'projects': [
    { value: 'gateway',  label: 'Gateway Towers' },
    { value: 'horizon',  label: 'Horizon Heights' },
    { value: 'meadow',   label: 'Meadow Greens' },
  ],
  'departments': [
    { value: 'sales',       label: 'Sales' },
    { value: 'marketing',   label: 'Marketing' },
    { value: 'support',     label: 'Customer Support' },
    { value: 'operations',  label: 'Operations' },
    { value: 'finance',     label: 'Finance' },
    { value: 'engineering', label: 'Engineering' },
  ],
  'designations': [
    { value: 'executive',  label: 'Executive' },
    { value: 'sr_executive', label: 'Sr. Executive' },
    { value: 'manager',    label: 'Manager' },
    { value: 'sr_manager', label: 'Sr. Manager' },
    { value: 'lead',       label: 'Team Lead' },
    { value: 'director',   label: 'Director' },
  ],
};

router.get('/:key', authenticate, (req, res) => {
  const data = SOURCES[req.params.key];
  if (!data) return res.status(404).json({ message: `Unknown options source "${req.params.key}"` });
  res.json({ items: data });
});

module.exports = router;
