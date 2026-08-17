# Architecture & Repository Map

This document is the source of truth for **what actually exists in this app**,
kept separate from the README (setup instructions) and from memory. Update it
whenever a capability's status changes — it's the thing that lets a new
session (human or AI) answer "is this real, is it finished, is it safe to
build on" without re-deriving it from the code.

Last reviewed: 2026-08-09.

---

## Capabilities

| Capability | Status | Where it lives |
|---|---|---|
| Public job browsing (search/filter/paginate, sponsored pinned) | ⚠️ Works, but implemented twice — see [Known duplication](#known-duplication) | `app/page.tsx`, `app/jobs/page.tsx` |
| Job detail panel + deep link + share | ✅ Working | `app/jobs/[id]/`, `components/jobs/job-detail-panel.tsx` |
| HR self-serve submission | ✅ Working | `app/submit/` → `POST /api/submit-job` |
| Submitter edit-by-token | ✅ Working | `app/submit/edit/` → `PATCH /api/submit-job/[token]` |
| Admin review queue (approve/reject + emails) | ✅ Working | `POST /api/admin/submissions/[id]/approve|reject` |
| Admin job CRUD | ✅ Working | `components/admin/job-form.tsx`, `job-table.tsx` |
| Admin bulk Excel import | ✅ Working | `components/admin/bulk-import.tsx` |
| Admin auth + route protection | ✅ Working | `middleware.ts` → `lib/supabase/middleware.ts` |
| Admin password reset | ✅ Working | `app/admin/reset-password/` |
| Admin user management | ✅ Working (fixed 2026-08-09). A second admin account was granted access via direct SQL the same day rather than through this UI — not because the UI didn't work, but because doing it via `/admin/users` requires an already-authenticated admin driving a browser, which wasn't available in that session. Prefer `/admin/users` for granting access going forward; it's the audited path (server-side, logged, self-removal-guarded). | `app/api/admin/users/`, `app/api/admin/users/[id]/` |
| AI-assisted job prefill | ✅ Working (switched to Gemini 2.5 Flash 2026-08-09); AI tier fires if `GEMINI_API_KEY` is set | `app/api/prefill-job/route.ts` |
| External job sync (cron) | ❌ Removed 2026-08-09 — was never functional | — |

### Known duplication

`app/page.tsx` (homepage) and `app/jobs/page.tsx` are near-identical
implementations of the same job-listing view — same fetch logic, same
filter state, drifted independently (the homepage's page-reset effect is
missing `filters.sponsored` in its dependency array; `/jobs` has it). This
is the highest-value refactor candidate: unify into one shared component
before adding more listing features, or the drift will keep compounding.

### Queued follow-ups

Found during `redesign/admin-jobs-table` (2026-08-17), deliberately not
built there — that branch is presentation-only. Not yet started.

- **`is_featured` — needs a direction decision, not a delete.** The admin
  jobs table redesign dropped Featured from the admin list's job cell (an
  explicit call: "Featured is gone from the product" was the working
  assumption going in) and no longer shows it anywhere in `/admin/jobs`.
  Checked before assuming that meant the column was dead — it isn't:
  - `components/admin/job-form.tsx` still has a live "Featured job
    (highlighted on homepage)" checkbox, reading and writing `is_featured`
    on every job create/edit.
  - `app/jobs/[id]/page.tsx` still renders a `Featured` badge on the
    **public** job detail page when `is_featured` is true.
  - `lib/excel-template.ts` / `components/admin/bulk-import.tsx` still
    have a `Featured` column in the bulk-import template that writes
    straight to `is_featured`.
  - The local DB has a real row with `is_featured = true` right now (the
    BMW "Marketing Communications Graduate" job) — set via the form
    checkbox, not stale seed data.
  - One genuinely dead thread: `components/jobs/jobs-sidebar.tsx`'s
    "Featured Jobs" link (`/?featured=true`) — neither `app/page.tsx` nor
    `app/jobs/page.tsx` reads that query param, so the link goes nowhere.

  So the actual decision is direction, not cleanup: either (a) Featured
  stays a real feature — fix the dead sidebar link, and decide how/whether
  it should resurface in the redesigned admin jobs list now that the row
  no longer shows it at a glance — or (b) Featured is fully deprecated —
  remove the form checkbox, the public badge, the bulk-import column, and
  the `is_featured` column/type themselves. Half-removing it (as it
  stands after the table redesign: settable and publicly visible, but
  invisible to the admin managing jobs) is the one option that isn't
  actually safe to leave as-is.

- **Reactivating a deactivated job has no path except direct DB access.**
  `JobActionsMenu` (`components/admin/job-table.tsx`) only ever offers
  Deactivate (active job) or Delete (inactive job) — there's no mutation
  that flips `is_active` back to `true`. Small, scoped fix once someone's
  ready to touch mutations on this table: a write path mirroring
  `handleDeactivate`'s existing `supabase.from('jobs').update(...)` call,
  a third dropdown branch so an inactive row offers both Activate and
  Delete, and an `'activate'` case added to `job-table.tsx`'s optimistic
  `JobAction` type (currently `'delete' | 'deactivate'` only). Probably
  doesn't need a confirm dialog — reversing a deactivation is lower-stakes
  than the actions that already have one — but worth deciding deliberately
  rather than copying Deactivate's confirm() by default.

### Deliberately dormant

- **AI prefill tier** (`extractWithAI` in `app/api/prefill-job/route.ts`,
  Gemini 2.5 Flash) only runs when `GEMINI_API_KEY` is set and the
  JSON-LD/embedded-state tiers came up empty. Absence of the key is not a
  bug — the other three extraction tiers still work — but real-world
  coverage drops sharply without it: verified live against a current
  Greenhouse posting (a modern client-rendered ATS with no JobPosting
  JSON-LD) and without the AI tier, company/location/tags/description all
  came back empty — only title and logo survived via OG-tag fallback. If
  prefill quality on JS-heavy ATS pages seems poor, check whether the key
  is set in Vercel first.

### Removed capabilities (historical record)

- **External job sync**: scheduled via Vercel Cron, hit `/api/sync-jobs`.
  Never worked — Cron sends GET, the sync logic only ran on POST; the
  external API URL was never configured; the adapter (`externalJobsAdapter.ts`)
  was an explicit placeholder guessing at field names for an API that was
  never integrated. Removed rather than fixed, since there was no real API
  contract to fix it against. If reintroduced, start from a known API shape.

- **Duplicate prefill implementation** (`supabase/functions/extract-job/`):
  an untracked (never committed) Supabase Edge Function that reimplemented
  the same 4-tier extraction pipeline as `/api/prefill-job`, but called
  Gemini directly via its own `GEMINI_API_KEY` instead of going through the
  Next.js route. Nothing in the app ever called it — it was fully
  disconnected. Discovered 2026-08-09 when a Gemini key set for it was
  mistaken for the main route's AI key. Its Gemini-calling logic was ported
  into `/api/prefill-job` (replacing the Anthropic tier) and the standalone
  function was deleted, along with its `supabase/config.toml` registration.

---

## Branch model

Trunk-based. `main` is always deployable — it's what Vercel ships — and is
never committed to directly.

```
main ─────●────●────●────●────●───────────►  protected, always deployable
           \      \       \
      feat/x    fix/y   chore/z            one unit of work, short-lived
```

**Prefixes** — chosen by risk, not by folder:

| Prefix | For |
|---|---|
| `feat/` | New user-facing capability |
| `fix/` | Something behaving wrongly |
| `chore/` | Deps, config, tooling, docs |
| `refactor/` | Behaviour-preserving restructure |
| `exp/` | Spike — may never merge |

**Rules:**
- One branch = one reviewable unit. Target under ~3 days lifetime.
- Squash-merge into `main`; delete the branch on merge.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `refactor:`,
  `chore:`) so `main`'s squashed log doubles as a changelog.

## Traceability

- **This file** — capability status, kept current.
- **Conventional commit messages on `main`** — `git log --grep="^fix"`
  answers "what broke recently and why."
- **`backup/*` tags** — snapshots taken before any destructive git
  operation (rebase, force-push, branch deletion). Never deleted.

## Repository settings (target state)

These require a GitHub-authenticated session to apply and are not yet
configured — see the session's final report for exact steps:

- Protect `main`: require PR before merge, require the Vercel build check,
  block force-push.
- Default merge strategy: squash. Disable plain merge commits.
- Auto-delete head branches on merge.
