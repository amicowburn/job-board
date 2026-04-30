-- Create job_submissions table
CREATE TABLE IF NOT EXISTS job_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  submitter_company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  url TEXT NOT NULL,
  location TEXT,
  work_mode TEXT CHECK (work_mode IS NULL OR work_mode IN ('remote', 'hybrid', 'onsite')),
  job_type TEXT CHECK (job_type IS NULL OR job_type IN ('internship', 'graduate', 'part-time', 'full-time', 'casual', 'contract')),
  description TEXT,
  company_logo_url TEXT,
  tags TEXT[],
  closing_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  edit_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER update_job_submissions_updated_at
  BEFORE UPDATE ON job_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS job_submissions_status_idx ON job_submissions (status);
CREATE UNIQUE INDEX IF NOT EXISTS job_submissions_edit_token_idx ON job_submissions (edit_token);

-- RLS
ALTER TABLE job_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a job"
  ON job_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all submissions"
  ON job_submissions FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update submissions"
  ON job_submissions FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete submissions"
  ON job_submissions FOR DELETE
  TO authenticated
  USING (is_admin());
