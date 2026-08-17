-- Drop the deprecated is_featured column.
--
-- Featured never grew past its initial schema/UI scaffolding (present since
-- the very first commit, 2026-03-10): a job-form checkbox that wrote it, a
-- "Featured" badge on the public job detail page that read it, and a
-- bulk-import template column. The checkbox's own promise — "highlighted on
-- homepage" — was never built in any commit since; the sidebar's
-- "Featured Jobs" link (/?featured=true) pointed at a query param nothing
-- ever read. is_sponsored is this app's actual, working promotion
-- mechanism and is untouched by this migration.
--
-- Every code reference (form, badge, bulk-import template, types, the
-- redesigned admin jobs table, the dead sidebar link) was removed in the
-- same pass as this migration — see docs/ARCHITECTURE.md for the full
-- decision record.
--
-- DESTRUCTIVE: production has 6 job rows, 1 with is_featured = true
-- (checked 2026-08-17 via /admin/jobs immediately before writing this
-- migration). That value is not recoverable from application code after
-- this runs — there is no "featured" concept left anywhere to restore it
-- into. Take a dump first if it matters:
--   supabase db dump --data-only --table public.jobs > jobs_backup.sql
--
-- DROP COLUMN cascades to any index defined solely on that column, so the
-- explicit DROP INDEX below is redundant with the DROP COLUMN that follows
-- it — kept anyway, spelled out rather than relied on implicitly, so this
-- migration is legible without knowing that Postgres detail.

DROP INDEX IF EXISTS idx_jobs_is_featured;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS is_featured;
