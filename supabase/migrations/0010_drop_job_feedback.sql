-- Drop the job feedback feature.
--
-- The public "Report an issue with this listing" form and the /admin/feedback
-- moderation queue were removed, so nothing reads or writes this table any
-- more. Dropping it here keeps the schema honest rather than leaving an
-- orphaned table that still accepts anonymous public INSERTs via its RLS
-- policy.
--
-- DESTRUCTIVE: this permanently deletes every row in job_feedback. There is no
-- application path to recreate them. Take a dump first if the history matters:
--   supabase db dump --data-only --table public.job_feedback > job_feedback_backup.sql
--
-- DROP TABLE removes the table's indexes, RLS policies, and the FK to jobs
-- along with it, so those need no separate statements.

DROP TABLE IF EXISTS public.job_feedback;
