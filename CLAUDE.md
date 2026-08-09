# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # localhost:3000
npm run build
npm run lint
```

## Next.js Version Warning

This project uses **Next.js 15** (App Router), which has breaking changes relative to older versions. APIs, conventions, and file structure may differ from training data. Check `node_modules/next/dist/docs/` before writing code; heed deprecation notices.

## Architecture Overview

MMSS Job Board — public job listings for Monash Marketing Students' Society, with HR self-serve submissions and an admin dashboard.

**Key directories:**
- `app/` — App Router routes (public, admin, API)
- `components/` — React components (`ui/`, `admin/`, `jobs/`)
- `lib/` — Supabase clients, types, utilities, email templates
- `supabase/migrations/` — 4 SQL migrations (full schema lives here)

## Supabase: Three Clients

This is the most important architectural detail. There are three distinct Supabase clients:

| Client | File | Key | Use |
|---|---|---|---|
| Browser | `lib/supabase/client.ts` | anon (RLS enforced) | Client components |
| Server | `lib/supabase/server.ts` | anon (RLS enforced) | Server components, route handlers |
| Admin | `lib/supabase/admin.ts` | service role (**bypasses RLS**) | Server-only: submissions approval, email sends |

Middleware (`middleware.ts` → `lib/supabase/middleware.ts`) refreshes auth tokens on every request and protects `/admin/*` routes by checking `admin_users.is_admin`.

## Routes

**Public:** `/` and `/jobs` (identical — known duplication, refactor candidate), `/jobs/[id]`, `/submit`, `/submit/edit?token=<edit-token>`

**Admin (requires `is_admin`):** `/admin/login`, `/admin/jobs`, `/admin/submissions`, `/admin/feedback`, `/admin/users`

**API routes:** `GET /api/prefill-job?url=` · `POST /api/submit-job` · `PATCH /api/submit-job/[token]` · `POST /api/admin/submissions/[id]/approve` · `POST /api/admin/submissions/[id]/reject` · `GET|POST /api/admin/users` · `DELETE /api/admin/users/[id]` · `POST /api/auth/signout`

## HR Submission Flow

1. Employer visits `/submit` → fills form → blur on URL field triggers AI prefill
2. `POST /api/submit-job` — inserts via service role, sends Resend emails non-blocking
3. Returns `edit_token`; submitter can re-edit via `/submit/edit?token=<token>`
4. Admin approves at `/admin/submissions` → creates job record + sends approval email

## AI Prefill (`/api/prefill-job`)

4-tier extraction: JSON-LD → embedded JS state → OG/meta tags → Gemini 2.5 Flash (fallback only if tier 1 didn't find title + company). SSRF-protected (DNS + private IP blocklist). Only runs if `GEMINI_API_KEY` is set — gracefully skips if missing.

## Database Schema

Main tables: `jobs`, `job_submissions` (pending HR queue), `job_feedback` (issue reports), `admin_users` (FK to `auth.users`).

`jobs` key fields: `title`, `company`, `url`, `description` (HTML), `tags` (TEXT[]), `work_mode` (remote|hybrid|onsite), `job_type` (internship|graduate|part-time|full-time|casual|contract), `is_active`, `is_featured`, `is_sponsored`, `source` (manual|external_api|submission), `external_id`.

GIN index on `tags[]`. Unique constraint on `(source, external_id)` for deduplication.

## Types & Utilities

- `lib/types.ts` — All DB types + Insert/Update variants. Use these at query sites.
- `lib/utils.ts` — `cn()` (clsx+twMerge), date helpers, `normalizeJobType()`, `normalizeWorkMode()`, `generateJobHash()` (SHA256), pagination helpers.
- `lib/email-templates.ts` — Resend HTML email templates (submission confirmation, approval, rejection).

## Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`

Optional (graceful fallback if missing): `GEMINI_API_KEY`, `RESEND_API_KEY`

## Styling

Tailwind CSS. Brand colors defined as CSS variables in `app/globals.css` (`--mmss-primary: #3d1472`, `--mmss-secondary: #5b2d8e`). Fonts: Inter (body), Outfit (headers). Custom UI primitives in `components/ui/` — no external component library.

## Known Issues

See `docs/ARCHITECTURE.md` for capability status. Notable: `app/page.tsx` and `app/jobs/page.tsx` are intentionally identical (deferred refactor). External job sync (cron) was removed and is non-functional.
