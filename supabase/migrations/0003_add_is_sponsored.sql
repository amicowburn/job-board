-- Add is_sponsored column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS jobs_is_sponsored_idx ON jobs (is_sponsored);
