-- ============================================================
-- Account feature — run ONCE in Supabase (Dashboard → SQL Editor)
-- Adds the executives table (used by the chatbot + Executives
-- page) and the account tables (income & expenditure records).
-- Safe to re-run: every statement uses IF NOT EXISTS.
-- ============================================================

CREATE TABLE IF NOT EXISTS executives (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  position    TEXT NOT NULL,
  image       TEXT NOT NULL DEFAULT '',
  sort_order  INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_years (
  id                   SERIAL PRIMARY KEY,
  year                 INT NOT NULL UNIQUE,
  opening_balance      DOUBLE PRECISION NOT NULL DEFAULT 0,
  financial_secretary  TEXT NOT NULL DEFAULT '',
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_entries (
  id          SERIAL PRIMARY KEY,
  year        INT NOT NULL REFERENCES account_years(year) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  name        TEXT NOT NULL,
  amount      DOUBLE PRECISION NOT NULL CHECK (amount >= 0),
  entry_date  DATE NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_entries_year ON account_entries(year, kind, entry_date);
