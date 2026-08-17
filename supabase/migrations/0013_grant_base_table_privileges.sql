-- Grant the base table privileges every RLS policy on these tables has
-- always assumed, but no migration ever actually granted.
--
-- RLS policies only take effect once a role already has the underlying
-- GRANT — Postgres checks table-level privileges first and returns a flat
-- "permission denied for table X" before RLS is even evaluated if that
-- grant is missing, regardless of how permissive the policy is. Every
-- table below has had correct, working-looking RLS policies since
-- 0001_init.sql (and 0004_add_job_submissions.sql), but none of them ever
-- got the matching GRANT — the hosted Supabase platform bootstraps that
-- automatically outside of tracked migrations, and this repo's migration
-- history just never carried an equivalent statement for anything but
-- analytics_events (0006, see its own "GRANTS" section — same root cause,
-- already fixed there with the same reasoning this migration repeats for
-- everything else).
--
-- Discovered 2026-08-17: a clean `supabase db reset` (unrelated
-- is_featured migration work) was the first time in a while every
-- migration ran against a genuinely fresh database, and every anon/
-- authenticated read on `jobs` started failing with `permission denied`.
-- information_schema.role_table_grants confirmed anon/authenticated/
-- service_role had TRUNCATE/REFERENCES/TRIGGER on every table (Postgres's
-- own defaults) but none of SELECT/INSERT/UPDATE/DELETE. This had likely
-- been true since 0001, just masked locally by a long-lived dev database
-- volume that predates a from-scratch reset, and unnoticed on the hosted
-- project only because Supabase's platform bootstrap grants these outside
-- of any migration this repo controls or can verify.
--
-- Grants below are scoped to what each table's own RLS policies already
-- allow per role — RLS is still what actually decides access; this only
-- makes that access reachable. service_role gets ALL on every table it
-- writes through (lib/supabase/admin.ts callers: the submissions API
-- routes, /api/admin/users, /api/track) since BYPASSRLS skips policy
-- evaluation but never substitutes for the base grant. job_feedback is
-- omitted — dropped in 0010. analytics_events is omitted — already
-- granted in 0006.
--
-- All three tables use `id UUID DEFAULT gen_random_uuid()`, not a
-- sequence, so there's nothing to grant on a SEQUENCE here (unlike
-- analytics_events's SERIAL id, which is why 0006 has one).

-- jobs: anon + authenticated can read active jobs ("Anyone can read active
-- jobs"); authenticated (admin) has full CRUD (the four "Admins can ..."
-- policies); service_role writes via the submission-approval route.
GRANT SELECT ON jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON jobs TO authenticated;
GRANT ALL ON jobs TO service_role;

-- job_submissions: anon + authenticated can submit ("Anyone can submit a
-- job"); authenticated (admin) can additionally read/update/delete;
-- service_role is how the submit/approve/reject/archive API routes
-- actually write.
GRANT INSERT ON job_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON job_submissions TO authenticated;
GRANT ALL ON job_submissions TO service_role;

-- admin_users: no anon policy exists, so anon gets nothing. authenticated
-- covers both "read own admin status" and the "Admins can ..." CRUD
-- policies. service_role is how /api/admin/users manages accounts.
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT ALL ON admin_users TO service_role;
