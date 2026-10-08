-- ============================================================
-- Past Executives feature — run ONCE in Supabase (Dashboard → SQL Editor)
-- Adds tenures (start/end year) and links executives to a tenure.
-- Executives with tenure_id NULL are the CURRENT executives, so
-- everything already on the site keeps working unchanged.
-- Safe to re-run: every statement uses IF NOT EXISTS.
-- ============================================================

CREATE TABLE IF NOT EXISTS executive_tenures (
  id          SERIAL PRIMARY KEY,
  start_year  INT NOT NULL,
  end_year    INT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_year >= start_year)
);

ALTER TABLE executives
  ADD COLUMN IF NOT EXISTS tenure_id INT REFERENCES executive_tenures(id) ON DELETE CASCADE;
