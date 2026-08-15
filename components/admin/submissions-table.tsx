'use client'

import { useOptimistic, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowSquareOutIcon, CheckIcon, XIcon, DotsThreeVerticalIcon, ArchiveIcon } from '@phosphor-icons/react'
import { Button, Badge, useConfirmDialog } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import { segmentedTabsListClassName, segmentedTabsTriggerClassName } from '@/components/ui/segmented-tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shadcn/tooltip'
import { formatDate } from '@/lib/utils'
import type { JobSubmission } from '@/lib/types'

const STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

/**
 * Dot + label colors for the grid's status column (STATUS_VARIANTS above
 * still feeds the mobile card's Badge, untouched by this pass). All three
 * statuses need to read as distinct at a glance, so all three get an
 * actual hue: warning/success/destructive, no muted state among them — the
 * "mute what's inactive" idea belongs to the jobs page's Inactive listings,
 * not a moderation decision here.
 *
 * Pending uses the new `--warning` token (app/globals.css), not `--accent`:
 * `--accent` is chroma 0 in both light and dark — literally grayscale, not
 * a shade-picking problem — so it can't carry a "needs attention" signal
 * regardless of which shade is used. `--warning` is a real amber hue.
 * Badge/Alert's `warning` variant still maps to `--accent` elsewhere in the
 * app (e.g. the "Featured" job badge) — worth migrating too, but wider than
 * this task.
 */
const STATUS_DOT_STYLES: Record<JobSubmission['status'], { dot: string; text: string }> = {
  pending: { dot: 'bg-warning', text: 'text-warning' },
  approved: { dot: 'bg-success', text: 'text-success' },
  rejected: { dot: 'bg-destructive', text: 'text-destructive' },
}

/** First letter of the first and last name; a single name just takes its first two letters. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Local-date comparison: a closing date of "today" isn't past yet. */
function isPastDate(isoDate: string): boolean {
  const closing = new Date(isoDate)
  closing.setHours(23, 59, 59, 999)
  return closing.getTime() < Date.now()
}

interface SubmissionsTableProps {
  submissions: JobSubmission[]
  totalCount: number
  currentPage: number
  totalPages: number
  /** Viewing the archive rather than the live queue. */
  showArchived?: boolean
  /**
   * True per-status totals for the filter tabs (not just this page).
   * Undefined — not zeros — means the count query failed or was skipped;
   * the tabs render without numbers rather than showing zeros that would
   * read as "nothing here."
   */
  counts?: { all: number; pending: number; approved: number; rejected: number }
}

export function SubmissionsTable({
  submissions,
  totalCount,
  currentPage,
  totalPages,
  showArchived = false,
  counts,
}: SubmissionsTableProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const { confirm, dialog } = useConfirmDialog()

  // Status flips to approved/rejected immediately; React drops the optimistic
  // layer if the request fails, restoring the pending row.
  const [optimisticSubmissions, applyOptimistic] = useOptimistic(
    submissions,
    (
      rows: JobSubmission[],
      update:
        | { type: 'status'; id: string; status: JobSubmission['status'] }
        | { type: 'remove'; id: string }
    ) =>
      update.type === 'remove'
        ? rows.filter((row) => row.id !== update.id)
        : rows.map((row) =>
            row.id === update.id ? { ...row, status: update.status } : row
          )
  )

  // Pending first (the thing waiting on a decision), then newest-submitted
  // first within each group. The server orders by created_at alone across
  // the whole table; this re-sorts within the fetched/filtered page only,
  // the same client-side scope the status filter above already works in —
  // it doesn't pull pending rows forward from a later page.
  const filtered = (
    filter === 'all' ? optimisticSubmissions : optimisticSubmissions.filter((s) => s.status === filter)
  )
    .slice()
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleApprove = async (id: string) => {
    const { confirmed } = await confirm({
      title: 'Publish this listing?',
      description:
        'The job goes live on the public board straight away, and the submitter is emailed to let them know.',
      confirmLabel: 'Approve and publish',
    })
    if (!confirmed) return

    startTransition(async () => {
      applyOptimistic({ type: 'status', id, status: 'approved' })

      const res = await fetch(`/api/admin/submissions/${id}/approve`, { method: 'POST' })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(body.error || 'Failed to approve submission')
        return
      }

      // The job is published either way — but if the submitter was never
      // emailed, the admin needs to know so they can follow up.
      if (body.email_sent === false) {
        toast.warning('Job published, but the approval email failed to send', {
          description: body.email_error,
          duration: 10000,
        })
      } else {
        toast.success('Job published to the live board')
      }

      router.refresh()
    })
  }

  const handleReject = async (id: string) => {
    const { confirmed, note } = await confirm({
      title: 'Reject this submission?',
      description:
        'The submitter is emailed to let them know their listing was not approved.',
      confirmLabel: 'Reject submission',
      destructive: true,
      note: {
        label: 'Reason for rejection (optional)',
        placeholder: 'e.g. This role is not relevant to marketing students.',
        helper: 'Leave blank to send the standard rejection message.',
      },
      // The note is rendered as a "Reviewer note" block in the rejection email
      // (lib/email-templates.ts). The old prompt claimed it was admin-only.
      warning:
        'Anything you write here is included in the email sent to the submitter. Do not record internal notes here.',
    })
    if (!confirmed) return

    startTransition(async () => {
      applyOptimistic({ type: 'status', id, status: 'rejected' })

      const res = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_note: note || null }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(body.error || 'Failed to reject submission')
        return
      }

      if (body.email_sent === false) {
        toast.warning('Submission rejected, but the notification email failed to send', {
          description: body.email_error,
          duration: 10000,
        })
      } else {
        toast.success('Submission rejected')
      }

      router.refresh()
    })
  }

  const handleArchive = async (id: string) => {
    if (!showArchived) {
      const { confirmed } = await confirm({
        title: 'Archive this submission?',
        description:
          'It leaves the queue but is kept in full — you can restore it from the archive at any time. The submitter is not notified.',
        confirmLabel: 'Archive',
      })
      if (!confirmed) return
    }

    startTransition(async () => {
      // Either way the row leaves the view it is currently in.
      applyOptimistic({ type: 'remove', id })

      const res = await fetch(`/api/admin/submissions/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !showArchived }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(
          body.error || (showArchived ? 'Failed to restore submission' : 'Failed to archive submission')
        )
        return
      }

      toast.success(showArchived ? 'Submission restored to the queue' : 'Submission archived')
      router.refresh()
    })
  }

  return (
    <>
      {/* Toolbar — chips scroll as one row rather than wrapping to a second
          line; "View archive" stays put outside the scroll area so it's
          always reachable at the right rather than sliding out of view. */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-2">
        <div className={`${segmentedTabsListClassName} overflow-x-auto min-w-0`}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={segmentedTabsTriggerClassName(filter === f, 'inline-flex items-center gap-1.5')}
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              {f}
              {counts && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium normal-case rounded-full bg-slate-200 text-slate-600 leading-none">
                  {counts[f] > 99 ? '99+' : counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        <Link
          href={showArchived ? '/admin/submissions' : '/admin/submissions?view=archived'}
          className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          <ArchiveIcon weight={showArchived ? 'fill' : 'regular'} className="size-3.5" />
          {showArchived ? 'Back to queue' : 'View archive'}
        </Link>
      </div>

      {/* Grid — lg and up only. A fixed 4-column template (submission /
          closes / status / actions) needs real width to breathe; below lg
          it's replaced by the card list rather than squeezed, same as the
          table this replaced was swapped out below md.

          Actions is 240px, not the target 76px, until Phase 4 swaps the
          Approve/Reject/Archive pill for 28px icon buttons — that pill needs
          real room (three ghost buttons + two separators) and 76px would
          just move the overflow from "visibly broken" to "silently clipped".
          240px is sized to the pill's actual rendered width, not a guess. */}
      <div className="hidden lg:block">
        <div
          role="row"
          className="grid grid-cols-[minmax(0,1fr)_84px_96px_76px] bg-slate-50 border-b border-slate-100"
        >
          <div className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 font-medium">Submission</div>
          <div className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 font-medium">Closes</div>
          <div className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 font-medium">Status</div>
          <div className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 font-medium">Actions</div>
        </div>

        {filtered.map((submission) => {
          // company/location: skip null segments instead of rendering a
          // dangling " · " when one side is missing.
          const secondaryLine = [submission.company, submission.location].filter(Boolean).join(' · ')

          // Submitter email/company and job type/work mode have no row spot
          // as of Phase 2, and stay that way — no tooltip bridge. They're
          // still reachable from the detail view / edit-token flow elsewhere
          // in the app, and none of them are what a moderator scans a queue
          // for, per the redesign's premise. Phase 4's overflow menu is
          // where they'll actually resurface, once that menu exists.
          const closed = submission.closing_at ? isPastDate(submission.closing_at) : false
          const statusStyle = STATUS_DOT_STYLES[submission.status]

          return (
            <div
              key={submission.id}
              role="row"
              className="grid grid-cols-[minmax(0,1fr)_84px_96px_76px] border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60 transition-colors"
            >
              {/* Submission — 30px initials avatar + a two-line text block
                  (job title with an inline external-link icon, then
                  company · location). ~56px tall in the common case; a
                  rejection note (rare, only on rejected rows) adds a third
                  truncated line rather than being dropped silently. */}
              <div className="min-w-0 px-5 py-3 flex items-center gap-2.5">
                <div
                  className="shrink-0 size-[30px] rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium flex items-center justify-center select-none"
                  aria-label={`Submitted by ${submission.submitter_name}`}
                >
                  {getInitials(submission.submitter_name)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{submission.title}</p>
                    <a
                      href={submission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open original listing"
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowSquareOutIcon className="size-3.5" />
                    </a>
                  </div>
                  {secondaryLine && (
                    <p className="text-xs text-muted-foreground truncate">{secondaryLine}</p>
                  )}
                  {submission.admin_note && (
                    // Muted, not destructive-red: the one field a moderator
                    // needs at a glance, but not an alarm. Truncated to one
                    // line — full text moves to the Phase 4 overflow menu,
                    // not a title tooltip.
                    <p className="text-xs text-muted-foreground truncate">
                      Sent to submitter: {submission.admin_note}
                    </p>
                  )}
                </div>
              </div>

              {/* Closes — right-aligned so it doesn't run up against Status.
                  Null and past-due both mute further than an open date, since
                  neither needs an admin's attention right now — reduced
                  opacity on muted-foreground rather than a separate slate
                  shade, since there's no dedicated "extra-muted" token. */}
              <div className="pr-5 py-3 flex items-center justify-end text-xs">
                {submission.closing_at ? (
                  <span className={closed ? 'text-muted-foreground/60' : 'text-muted-foreground'}>
                    {formatDate(submission.closing_at)}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60">—</span>
                )}
              </div>

              {/* Status — fixed width on every row including pending, so the
                  dot lands at the same x-position all the way down. */}
              <div className="px-5 py-3 flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full shrink-0 ${statusStyle.dot}`} aria-hidden="true" />
                <span className={`text-xs font-medium capitalize ${statusStyle.text}`}>
                  {submission.status}
                </span>
              </div>

              {/* Actions — 240px for now (see the grid comment above); still
                  fixed width regardless of which/how many actions this row
                  has, so it never absorbs space at the status column's expense. */}
              <div className="px-5 py-3 flex items-center">
                <SubmissionActionsMenu
                  submission={submission}
                  showArchived={showArchived}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onArchive={handleArchive}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Cards — below lg. Same fields as the grid, same card pattern
          (border/radius, 12px gaps via space-y-3) as the admin job list,
          so a submitter's name/email, org, job, and the location/type/
          closing badges read as one record instead of a squeezed row. */}
      <div className="lg:hidden p-4 space-y-3">
        {filtered.map((submission) => (
          <div key={submission.id} className="rounded-xl border border-slate-100 p-3 space-y-2">
            {/* Submitter + status */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 leading-tight">{submission.submitter_name}</p>
                <a href={`mailto:${submission.submitter_email}`} className="text-xs text-primary hover:underline break-all">
                  {submission.submitter_email}
                </a>
                <p className="text-xs text-slate-400 mt-0.5">{submission.submitter_company_name}</p>
              </div>
              <Badge variant={STATUS_VARIANTS[submission.status] || 'secondary'} className="rounded-full capitalize shrink-0">
                {submission.status}
              </Badge>
            </div>

            {/* Job title + company */}
            <div>
              <p className="text-sm font-medium text-slate-700 leading-tight">{submission.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{submission.company}</p>
            </div>

            {/* Location/type/mode/closing as small badges */}
            {(submission.location || submission.job_type || submission.work_mode || submission.closing_at) && (
              <div className="flex flex-wrap gap-1">
                {submission.location && (
                  <Badge variant="outline" className="rounded-full text-[11px] font-normal">{submission.location}</Badge>
                )}
                {submission.job_type && (
                  <Badge variant="outline" className="rounded-full text-[11px] font-normal capitalize">{submission.job_type}</Badge>
                )}
                {submission.work_mode && (
                  <Badge variant="outline" className="rounded-full text-[11px] font-normal capitalize">{submission.work_mode}</Badge>
                )}
                {submission.closing_at && (
                  <Badge variant="outline" className="rounded-full text-[11px] font-normal">Closes {formatDate(submission.closing_at)}</Badge>
                )}
              </div>
            )}

            {submission.admin_note && (
              <p className="text-xs text-destructive">Sent to submitter: {submission.admin_note}</p>
            )}

            {/* View link + submitted date */}
            <div className="flex items-center justify-between">
              <a href={submission.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                View link ↗
              </a>
              <span className="text-xs text-slate-400">{formatDate(submission.created_at)}</span>
            </div>

            {/* Actions, right-aligned in its own row */}
            <div className="flex items-center justify-end pt-1 border-t border-slate-100">
              <SubmissionActionsMenu
                submission={submission}
                showArchived={showArchived}
                onApprove={handleApprove}
                onReject={handleReject}
                onArchive={handleArchive}
              />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          {showArchived
            ? 'Nothing archived'
            : filter !== 'all'
              ? `No ${filter} submissions`
              : 'No job submissions yet'}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {totalCount} submissions
        </p>
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/submissions" />
      </div>

      {dialog}
    </>
  )
}

/**
 * Pending: two 28px icon buttons (Approve/Reject) + the overflow ellipsis.
 * Non-pending: the ellipsis alone, still right-aligned in the same column —
 * a lone icon button, not a lone icon button plus two icon-sized gaps where
 * Approve/Reject would have been.
 *
 * The ellipsis is where everything Phase 2/3 took off the row lands:
 * Archive/Restore, submitter email/company, job type/work mode, the
 * submitted date, and — when present — the full rejection note (the row
 * only ever shows a truncated line of it).
 */
function SubmissionActionsMenu({
  submission,
  showArchived,
  onApprove,
  onReject,
  onArchive,
}: {
  submission: JobSubmission
  showArchived: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onArchive: (id: string) => void
}) {
  const showPendingActions = submission.status === 'pending' && !showArchived
  const jobMeta = [submission.job_type, submission.work_mode].filter(Boolean).join(' · ')

  return (
    <div className="flex items-center justify-end gap-1">
      {showPendingActions && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-success hover:text-success hover:bg-success/10"
                aria-label="Approve"
                onClick={() => onApprove(submission.id)}
              >
                <CheckIcon weight="bold" className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Approve</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label="Reject"
                onClick={() => onReject(submission.id)}
              >
                <XIcon weight="bold" className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reject</TooltipContent>
          </Tooltip>
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            aria-label="More options"
          >
            <DotsThreeVerticalIcon weight="bold" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={() => onArchive(submission.id)}>
            {showArchived ? 'Restore' : 'Archive'}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Submitted by</DropdownMenuLabel>
          <div className="px-3 pb-2 -mt-1 space-y-0.5">
            <p className="text-sm font-medium text-popover-foreground">{submission.submitter_name}</p>
            <p className="text-xs text-muted-foreground truncate">{submission.submitter_email}</p>
            <p className="text-xs text-muted-foreground truncate">{submission.submitter_company_name}</p>
          </div>

          <div className="px-3 pb-2 text-xs text-muted-foreground">
            {jobMeta && <span className="capitalize">{jobMeta} · </span>}
            Submitted {formatDate(submission.created_at)}
          </div>

          {submission.admin_note && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sent to submitter</DropdownMenuLabel>
              <p className="px-3 pb-2 -mt-1 text-xs text-muted-foreground">{submission.admin_note}</p>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
