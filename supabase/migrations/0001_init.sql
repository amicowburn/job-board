-- MMSS Job Board Database Schema
-- ================================
-- Run this migration in your Supabase SQL Editor or via Supabase CLI

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- TABLES
-- =====================

-- Admin Users table (links to Supabase Auth)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'manual',
  external_id TEXT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  work_mode TEXT CHECK (work_mode IS NULL OR work_mode IN ('remote', 'hybrid', 'onsite')),
  job_type TEXT CHECK (job_type IS NULL OR job_type IN ('internship', 'graduate', 'part-time', 'full-time', 'casual', 'contract')),
  url TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  posted_at TIMESTAMPTZ,
  closing_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job Feedback table
CREATE TABLE IF NOT EXISTS job_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('scam', 'expired', 'broken_link', 'incorrect_info', 'other')),
  message TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================

-- Unique constraint on source + external_id (for upserts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_external_id
  ON jobs (source, external_id)
  WHERE external_id IS NOT NULL;

-- Index for listing jobs (commonly filtered/sorted)
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs (posted_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_jobs_closing_at ON jobs (closing_at ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON jobs (is_featured) WHERE is_featured = TRUE;

-- GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_jobs_tags ON jobs USING GIN (tags);

-- Index for job feedback
CREATE INDEX IF NOT EXISTS idx_job_feedback_job_id ON job_feedback (job_id);
CREATE INDEX IF NOT EXISTS idx_job_feedback_status ON job_feedback (status);
CREATE INDEX IF NOT EXISTS idx_job_feedback_created_at ON job_feedback (created_at DESC);

-- =====================
-- FUNCTIONS
-- =====================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_feedback ENABLE ROW LEVEL SECURITY;

-- =====================
-- ADMIN_USERS POLICIES
-- =====================

-- Users can read their own admin status
CREATE POLICY "Users can read own admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all admin_users
CREATE POLICY "Admins can read all admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only admins can insert admin_users
CREATE POLICY "Admins can insert admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Only admins can update admin_users
CREATE POLICY "Admins can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admins can delete admin_users
CREATE POLICY "Admins can delete admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- =====================
-- JOBS POLICIES
-- =====================

-- Public can read active jobs
CREATE POLICY "Anyone can read active jobs"
  ON jobs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Admins can read ALL jobs (including inactive)
CREATE POLICY "Admins can read all jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only admins can insert jobs
CREATE POLICY "Admins can insert jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Only admins can update jobs
CREATE POLICY "Admins can update jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admins can delete jobs
CREATE POLICY "Admins can delete jobs"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- =====================
-- JOB_FEEDBACK POLICIES
-- =====================

-- Anyone can insert feedback (anonymous allowed)
CREATE POLICY "Anyone can submit feedback"
  ON job_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Only admins can read feedback
CREATE POLICY "Admins can read feedback"
  ON job_feedback
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only admins can update feedback
CREATE POLICY "Admins can update feedback"
  ON job_feedback
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admins can delete feedback
CREATE POLICY "Admins can delete feedback"
  ON job_feedback
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- =====================
-- SERVICE ROLE BYPASS
-- =====================
-- Note: The service role key bypasses RLS automatically.
-- This is used for the sync endpoint which runs server-side.

-- =====================
-- BOOTSTRAP INSTRUCTIONS
-- =====================
-- To create the first admin user:
-- 1. Create a user via Supabase Auth (email/password)
-- 2. Get the user's UUID from auth.users
-- 3. Run: INSERT INTO admin_users (id, is_admin) VALUES ('USER_UUID_HERE', TRUE);
--
-- Example SQL after creating user in Auth:
-- INSERT INTO admin_users (id, is_admin)
-- SELECT id, TRUE FROM auth.users WHERE email = 'admin@example.com';
