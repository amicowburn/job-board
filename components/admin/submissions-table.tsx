'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Badge, useConfirmDialog } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import { formatDate } from '@/lib/utils'
import type { JobSubmission } from '@/lib/types'

const STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

interface SubmissionsTableProps {
  submissions: JobSubmission[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export function SubmissionsTable({
  submissions,
  totalCount,
  currentPage,
  totalPages,
}: SubmissionsTableProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const { confirm, dialog } = useConfirmDialog()

  // Status flips to approved/rejected immediately; React drops the optimistic
  // layer if the request fails, restoring the pending row.
  const [optimisticSubmissions, applyOptimistic] = useOptimistic(
    submissions,
    (rows: JobSubmission[], update: { id: string; status: JobSubmission['status'] }) =>
      rows.map((row) => (row.id === update.id ? { ...row, status: update.status } : row))
  )

  const filtered =
    filter === 'all'
      ? optimisticSubmissions
      : optimisticSubmissions.filter((s) => s.status === filter)

  const handleApprove = async (id: string) => {
    const { confirmed } = await confirm({
      title: 'Publish this listing?',
      description:
        'The job goes live on the public board straight away, and the submitter is emailed to let them know.',
      confirmLabel: 'Approve and publish',
    })
    if (!confirmed) return

    startTransition(async () => {
      applyOptimistic({ id, status: 'approved' })

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
      applyOptimistic({ id, status: 'rejected' })

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

  return (
    <>
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Submitter</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Job</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Details</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Submitted</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((submission) => (
              <tr key={submission.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-800">{submission.submitter_name}</p>
                  <a href={`mailto:${submission.submitter_email}`} className="text-xs text-primary hover:underline">
                    {submission.submitter_email}
                  </a>
                  <p className="text-xs text-slate-400 mt-0.5">{submission.submitter_company_name}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-800">{submission.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{submission.company}</p>
                  <a href={submission.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    View link ↗
                  </a>
                </td>
                <td className="px-5 py-4 text-xs text-slate-400 space-y-0.5">
                  {submission.location && <p>{submission.location}</p>}
                  {submission.job_type && <p className="capitalize">{submission.job_type}</p>}
                  {submission.work_mode && <p className="capitalize">{submission.work_mode}</p>}
                  {submission.closing_at && <p>Closes {formatDate(submission.closing_at)}</p>}
                  {submission.admin_note && (
                    <p className="text-destructive">Sent to submitter: {submission.admin_note}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={STATUS_VARIANTS[submission.status] || 'secondary'} className="rounded-full capitalize">
                    {submission.status}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-xs text-slate-400">
                  {formatDate(submission.created_at)}
                </td>
                <td className="px-5 py-4">
                  {submission.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-success" onClick={() => handleApprove(submission.id)}>
                        Approve
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleReject(submission.id)}>
                        Reject
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          {filter !== 'all' ? `No ${filter} submissions` : 'No job submissions yet'}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {totalCount} submissions
        </p>
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/submissions" />
      </div>

      {dialog}
    </>
  )
}
