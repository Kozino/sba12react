'use strict';
/**
 * One-time setup for the database.
 *
 *   1. Creates every table (from ../supabase/schema.sql).
 *   2. Seeds sample data (members, payments, news, blogs, gallery,
 *      documents incl. the constitution, the default admin) — ONLY if
 *      the tables are empty, so it is safe to re-run.
 *   3. Uploads the seed images + constitution PDF to Storage
 *      (Supabase Storage in production, ./uploads in development).
 *
 * Usage:  npm run seed     (with DATABASE_URL in .env)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./src/db');
const { storeFile, isSupabase, localDir } = require('./src/storage');

const SCHEMA = path.join(__dirname, '..', 'supabase', 'schema.sql');
const SEED = path.join(__dirname, '..', 'seed-data.json');
const FILES = path.join(__dirname, 'seed-files');

const MIME = { '.jpg': 'image/jpeg', '.pdf': 'application/pdf' };

async function tableCount(t) {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
  return rows[0].c;
}

async function insertIfEmpty(table, rows, columns) {
  const c = await tableCount(table);
  if (c > 0) {
    console.log(`  • ${table}: already has ${c} rows — skipped`);
    return;
  }
  if (!rows.length) {
    console.log(`  • ${table}: no seed rows`);
    return;
  }
  for (const r of rows) {
    const cols = columns.map((k) => r[k]).filter((v) => v !== undefined);
    const keys = columns.filter((k) => r[k] !== undefined);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    await pool.query(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
      cols
    );
  }
  console.log(`  • ${table}: inserted ${rows.length} rows`);
}

(async () => {
  console.log('SBA 2012 — seeding', isSupabase() ? 'Supabase Postgres + Storage' : 'local Postgres + disk');

  // 1. Schema
  const schema = fs.readFileSync(SCHEMA, 'utf8');
  await pool.query(schema);
  console.log('  • schema applied (all tables ensured)');

  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));

  // 2. Rows
  const seedAdminPass = (process.env.SEED_ADMIN_PASSWORD || '').trim();
  await insertIfEmpty('admins', seed.admins.map((a) => ({
    username: a.username,
    name: a.name,
    password: seedAdminPass ? bcrypt.hashSync(seedAdminPass, 10) : (a.password_hash || a.password),
  })), ['username', 'name', 'password']);

  await insertIfEmpty('members', seed.members, [
    'unique_id', 'first_name', 'middle_name', 'last_name', 'email', 'phone',
    'hometown', 'hometown_parish', 'residential_address', 'permanent_address',
    'status', 'registered_at',
  ]);

  // payments reference member ids by position — re-map by unique_id order
  if ((await tableCount('payments')) === 0 && seed.payments.length) {
    const members = await pool.query('SELECT id, unique_id FROM members ORDER BY id');
    const idByUid = {};
    for (const m of members.rows) idByUid[m.unique_id] = m.id;
    for (const p of seed.payments) {
      const member_id = idByUid[p.member_id] || p.member_id;
      await pool.query(
        `INSERT INTO payments (member_id, type, year, expected, paid, note)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (member_id, type, year) DO NOTHING`,
        [member_id, p.type, p.year, p.expected, p.paid, p.note || '']
      );
    }
    console.log(`  • payments: inserted ${seed.payments.length} rows`);
  } else {
    console.log('  • payments: already has rows — skipped');
  }

  await insertIfEmpty('news', seed.news, ['title', 'body', 'image', 'date']);
  await insertIfEmpty('blogs', seed.blogs, ['title', 'author', 'excerpt', 'body', 'image', 'date']);
  await insertIfEmpty('gallery', seed.gallery, ['title', 'caption', 'image', 'event_year']);
  await insertIfEmpty(
    'documents',
    seed.documents.map((d) => ({
      type: d.type,
      year: d.year ?? null,
      title: d.title || '',
      filename: d.filename || '',
      text: d.text || '',
    })),
    ['type', 'year', 'title', 'filename', 'text']
  );
  await insertIfEmpty('messages', seed.messages, ['name', 'email', 'phone', 'subject', 'message']);
  await insertIfEmpty('settings', seed.settings, ['key', 'value']);

  // 3. Files
  const files = fs.readdirSync(FILES);
  for (const f of files) {
    const buf = fs.readFileSync(path.join(FILES, f));
    if (isSupabase()) {
      await storeFile(buf, f, MIME[path.extname(f)] || 'application/octet-stream');
    } else {
      const dir = localDir();
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, f), buf);
    }
    console.log(`  • file: ${f}`);
  }

  const admin = seed.admins[0];
  console.log('\nDone. Default admin login:');
  console.log(`  username: ${admin.username}`);
  console.log(
    seedAdminPass
      ? '  password: (the SEED_ADMIN_PASSWORD you set)'
      : '  password: sba12admin   ← CHANGE THIS in Admin → Settings after first login'
  );

  await pool.end();
})().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
