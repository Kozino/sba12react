'use strict';
const { one, q } = require('./db');

// Uppercase letters minus I,O + digits 2-9 (no 0,1,2? -> we use 23456789) —
// matches the original: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function generateUniqueId() {
  for (let attempt = 0; attempt < 10; attempt++) {
    let suffix = '';
    for (let i = 0; i < 3; i++) {
      suffix += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
    }
    const id = 'SBA12' + suffix;
    const existing = await one('SELECT 1 AS x FROM members WHERE unique_id = $1', [id]);
    if (!existing) return id;
  }
  throw new Error('Could not generate a unique member ID, please retry.');
}

const PAYMENT_TYPES = ['annual_due', 'financial_presence', 'burial_contribution', 'wedding_contribution'];
const DOC_TYPES = ['financial_report', 'minutes', 'attendance', 'financial_presence', 'constitution'];

function validEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validPhone(v) {
  return v === '' || /^\+?[0-9\s\-()]{8,18}$/.test(String(v));
}

/**
 * Compute payment status (kept identical to the other site versions):
 *  paid >= expected (expected>0)  -> Paid
 *  0 < paid < expected            -> Partially Paid
 *  expected>0, paid=0             -> Owing
 *  expected=0, paid>0             -> Contribution
 *  otherwise                      -> No Record
 */
function paymentStatus(expected, paid) {
  expected = Number(expected) || 0;
  paid = Number(paid) || 0;
  if (expected > 0 && paid >= expected) return 'Paid';
  if (expected > 0 && paid > 0) return 'Partially Paid';
  if (expected > 0) return 'Owing';
  if (paid > 0) return 'Contribution';
  return 'No Record';
}

function yearInt(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : (fallback || new Date().getFullYear());
}

module.exports = {
  generateUniqueId,
  PAYMENT_TYPES,
  DOC_TYPES,
  validEmail,
  validPhone,
  paymentStatus,
  yearInt,
};
