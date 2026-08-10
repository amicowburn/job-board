-- Archiving for job submissions.
--
-- Admins had no way to clear the submissions queue: rejecting only flips
-- `status`, so test, duplicate and spam rows accumulated permanently and the
-- only way to remove them was raw SQL.
--
-- Archiving rather than deleting is deliberate. A submission carries the
-- employer's contact details, the reasoning behind a decision, and the
-- `edit_token` powering their /submit/edit link — hard-deleting silently
-- breaks that link and destroys the audit trail, with no undo. Archiving
-- takes the row out of the queue while keeping all of it, and is reversible.

ALTER TABLE job_submissions
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- The queue reads unarchived rows on every admin page load, and the nav badge
-- counts unarchived pending rows. Partial index keeps both off a full scan.
CREATE INDEX IF NOT EXISTS job_submissions_active_idx
  ON job_submissions (created_at DESC)
  WHERE archived_at IS NULL;

COMMENT ON COLUMN job_submissions.archived_at IS
  'When an admin archived this submission. NULL means it is still in the queue. Archiving hides the row without discarding the record.';
