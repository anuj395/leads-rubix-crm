const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middlewares/auth');
const { countryNames } = require('../utils/countries');

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

const STATES_BY_COUNTRY = {
  'India': [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
    'Uttarakhand', 'West Bengal', 'Delhi'
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming'
  ]
};

router.get('/:key', authenticate, async (req, res) => {
  const { key } = req.params;
  
  if (key === 'countries') {
    return res.json({ items: countryNames });
  }
  
  if (key === 'states') {
    const country = req.query.country || 'India';
    const list = STATES_BY_COUNTRY[country] || STATES_BY_COUNTRY['India'];
    const options = list.map(s => ({ value: s, label: s }));
    return res.json({ items: options });
  }
  
  if (key === 'industries') {
    try {
      const Industry = mongoose.model('Industry');
      const list = await Industry.find({ is_active: true }).sort({ name: 1 }).lean().exec();
      const options = list.map(ind => ({ value: ind.code, label: ind.name }));
      return res.json({ items: options });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch industries' });
    }
  }

  const data = SOURCES[key];
  if (!data) return res.status(404).json({ message: `Unknown options source "${key}"` });
  res.json({ items: data });
});

module.exports = router;
