-- Short, card-preview-only summary, distinct from the full `description`.
--
-- Job cards previously showed a naive 120-char substring of `description`,
-- which cuts mid-word/mid-sentence whenever the source text runs long. This
-- column carries a purpose-written 1-2 line summary instead: AI-suggested
-- (via the /api/prefill-job Gemini tier) on HR submissions, reviewable and
-- editable by the submitter like every other prefilled field, or typed by
-- hand on the admin's manual job-add path. Nullable and additive — anything
-- without one (pre-existing jobs, submissions where AI prefill didn't fire)
-- falls back to the existing truncated-description preview on the card.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE job_submissions
  ADD COLUMN IF NOT EXISTS summary TEXT;

COMMENT ON COLUMN jobs.summary IS
  'Short 1-2 line card-preview summary, distinct from the full description shown on the detail page. NULL falls back to a truncated description on the card.';

COMMENT ON COLUMN job_submissions.summary IS
  'AI-suggested (or hand-written) short summary carried through to jobs.summary on approval. NULL if AI prefill did not run or found nothing.';
