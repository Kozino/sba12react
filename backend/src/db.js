'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase's connection string is safe with SSL; set DATABASE_SSL=true to force it
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

/** Run a query, return all rows. */
async function q(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows;
}

/** Run a query, return the first row (or null). */
async function one(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows[0] || null;
}

module.exports = { pool, q, one };
