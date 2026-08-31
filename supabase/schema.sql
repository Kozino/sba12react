-- ============================================================
-- Savio Bosco Alphas 2012 — PostgreSQL schema (Supabase)
-- Run this in the Supabase SQL editor (Dashboard → SQL → New
-- query → paste → Run). It is idempotent: safe to re-run.
--
-- After running it, in the backend folder run:  npm run seed
-- (seeds the tables + uploads the seed files to Storage)
-- ============================================================

-- ---------- Members ----------
-- status: 'pending' (awaiting approval), 'active', 'rejected'
-- unique_id: SBA12 + 3 random chars from ABCDEFGHJKLMNPQRSTUVWXYZ23456789
CREATE TABLE IF NOT EXISTS members (
  id                 SERIAL PRIMARY KEY,
  unique_id          TEXT NOT NULL UNIQUE,
  first_name         TEXT NOT NULL,
  middle_name        TEXT NOT NULL DEFAULT '',
  last_name          TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  phone              TEXT NOT NULL DEFAULT '',
  hometown           TEXT NOT NULL DEFAULT '',
  hometown_parish    TEXT NOT NULL DEFAULT '',
  residential_address TEXT NOT NULL DEFAULT '',
  permanent_address  TEXT NOT NULL DEFAULT '',
  status             TEXT NOT NULL DEFAULT 'pending',
  registered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Payments ----------
-- type: annual_due | financial_presence | burial_contribution | wedding_contribution
-- One row per (member, type, year).
-- Status is COMPUTED by the app (no column):
--   paid >= expected (expected > 0)            -> Paid
--   0 < paid < expected                        -> Partially Paid
--   expected > 0 and paid = 0                  -> Owing
--   expected = 0 and paid > 0 (burial/wedding) -> Contribution
CREATE TABLE IF NOT EXISTS payments (
  id         SERIAL PRIMARY KEY,
  member_id  INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  year       INT NOT NULL,
  expected   DOUBLE PRECISION NOT NULL DEFAULT 0,
  paid       DOUBLE PRECISION NOT NULL DEFAULT 0,
  note       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, type, year)
);

-- ---------- News ----------
CREATE TABLE IF NOT EXISTS news (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  image      TEXT NOT NULL DEFAULT '',
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Blogs ----------
CREATE TABLE IF NOT EXISTS blogs (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  author     TEXT NOT NULL DEFAULT '',
  excerpt    TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL,
  image      TEXT NOT NULL DEFAULT '',
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Gallery ----------
-- event_year: year the photo was taken (for per-year browsing)
CREATE TABLE IF NOT EXISTS gallery (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL DEFAULT '',
  caption    TEXT NOT NULL DEFAULT '',
  image      TEXT NOT NULL,
  event_year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Documents ----------
-- type: financial_report | minutes | attendance | financial_presence | constitution
-- file: storage object name (pdf/txt) — constitution also has full text
CREATE TABLE IF NOT EXISTS documents (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL,
  year        INT,
  title       TEXT NOT NULL DEFAULT '',
  filename    TEXT NOT NULL DEFAULT '',
  text        TEXT NOT NULL DEFAULT '',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Contact messages ----------
CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  subject    TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Site settings (key/value) ----------
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- ---------- Admins ----------
-- password: bcrypt hash
CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  username   TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL DEFAULT '',
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Useful for the payments page
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_year ON documents(type, year);
CREATE INDEX IF NOT EXISTS idx_gallery_year ON gallery(event_year);
