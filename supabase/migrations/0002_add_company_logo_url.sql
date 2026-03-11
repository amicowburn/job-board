-- Add company_logo_url column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_logo_url TEXT;
