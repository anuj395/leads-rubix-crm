// src/models/bookingModel.js
// Bookings made against a contact / lead. Per the migration spec, holds
// embedded contactDetails / bookingDetails / notes / attachments / callLogs
// arrays so the entire booking artefact is self-contained. Freeform schema
// so the SuperAdmin can add tenant-specific fields through screen-config.

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    industry_id:    { type: String, default: null, index: true },
    // Optional reference to the contact this booking originated from.
    contact_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null, index: true },
    customer_name:  { type: String, default: '' },
    contact_no:     { type: String, default: '' },
    project:        { type: String, default: '' },
    location:       { type: String, default: '' },
    branch:         { type: String, default: '' },
    team:           { type: String, default: '' },
    reporting_to:   { type: String, default: '' },
    contactDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    bookingDetails: { type: [mongoose.Schema.Types.Mixed], default: [] },
    notes:          { type: [mongoose.Schema.Types.Mixed], default: [] },
    attachments:    { type: [mongoose.Schema.Types.Mixed], default: [] },
    callLogs:       { type: [mongoose.Schema.Types.Mixed], default: [] },
    is_active:      { type: Boolean, default: true },
    created_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, strict: false, minimize: false },
);

const Booking = mongoose.model('Booking', bookingSchema, 'bookings');
exports.Booking = Booking;
