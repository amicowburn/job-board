'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge, Alert, AlertDescription } from '@/components/ui'
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
}

export function SubmissionsTable({ submissions, totalCount }: SubmissionsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this submission and publish it to the live job board?')) return
    setError('')
    setSuccess('')

    const res = await fetch(`/api/admin/submissions/${id}/approve`, { method: 'POST' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Failed to approve submission')
    } else {
      setSuccess('Job published to the live board.')
      startTransition(() => router.refresh())
    }
  }

  const handleReject = async (id: string) => {
    const note = window.prompt('Optional rejection note (visible to admins only):') ?? ''
    if (note === null) return // user cancelled

    setError('')
    setSuccess('')

    const res = await fetch(`/api/admin/submissions/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_note: note || null }),
    })

    if (!res.ok) {
      setError('Failed to reject submission')
    } else {
      setSuccess('Submission rejected.')
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Submitter</th>
                <th className="px-4 py-3 text-left font-medium">Job</th>
                <th className="px-4 py-3 text-left font-medium">Details</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map(submission => (
                <tr key={submission.id} className={isPending ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{submission.submitter_name}</p>
                    <a
                      href={`mailto:${submission.submitter_email}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {submission.submitter_email}
                    </a>
                    <p className="text-xs text-muted-foreground">{submission.submitter_company_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{submission.title}</p>
                    <p className="text-xs text-muted-foreground">{submission.company}</p>
                    <a
                      href={submission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View application link ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground space-y-0.5">
                    {submission.location && <p>{submission.location}</p>}
                    {submission.job_type && <p className="capitalize">{submission.job_type}</p>}
                    {submission.work_mode && <p className="capitalize">{submission.work_mode}</p>}
                    {submission.closing_at && <p>Closes {formatDate(submission.closing_at)}</p>}
                    {submission.admin_note && (
                      <p className="text-destructive">Note: {submission.admin_note}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[submission.status] || 'secondary'}>
                      {submission.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(submission.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {submission.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success"
                          onClick={() => handleApprove(submission.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleReject(submission.id)}
                        >
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
        {submissions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No job submissions yet
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {submissions.length} of {totalCount} submissions
      </p>
    </div>
  )
}
