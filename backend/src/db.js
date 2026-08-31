'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Set DATABASE_SSL=true if your connection requires SSL
  // (Supabase's POOLED string on port 5432 does; the DIRECT string works either way)
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  // Fail fast instead of hanging forever on a bad connection string
  connectionTimeoutMillis: 15000,
  statement_timeout: 20000,
  max: 10,
});

// Surface idle-client errors (bad pool config) so logs show the cause
pool.on('error', (err) => {
  console.error('pg pool error:', err.code || '', err.message);
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
