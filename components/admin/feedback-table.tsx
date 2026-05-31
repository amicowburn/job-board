'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Badge, Alert, AlertDescription } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { JobFeedback, Job } from '@/lib/types'

interface FeedbackWithJob extends JobFeedback {
  jobs: Pick<Job, 'id' | 'title' | 'company'> | null
}

interface FeedbackTableProps {
  feedback: FeedbackWithJob[]
  totalCount: number
  currentPage: number
  totalPages: number
}

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  scam: 'Potential Scam',
  expired: 'Expired',
  broken_link: 'Broken Link',
  incorrect_info: 'Incorrect Info',
  other: 'Other',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  new: 'default',
  reviewed: 'secondary',
  removed: 'destructive',
}

export function FeedbackTable({ feedback, totalCount, currentPage, totalPages }: FeedbackTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleUpdateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('job_feedback').update({ status } as { status: string }).eq('id', id)
    if (error) setError('Failed to update status')
    else { setSuccess('Status updated'); startTransition(() => router.refresh()) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return
    const supabase = createClient()
    const { error } = await supabase.from('job_feedback').delete().eq('id', id)
    if (error) setError('Failed to delete feedback')
    else { setSuccess('Feedback deleted'); startTransition(() => router.refresh()) }
  }

  return (
    <>
      {/* Alerts */}
      {(error || success) && (
        <div className="px-5 py-3 border-b border-slate-100">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert variant="success"><AlertDescription>{success}</AlertDescription></Alert>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Job</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Type</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Message</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Email</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Date</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {feedback.map((item) => (
              <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${isPending ? 'opacity-50' : ''}`}>
                <td className="px-5 py-4">
                  {item.jobs ? (
                    <Link href={`/admin/jobs/${item.jobs.id}/edit`} className="hover:underline">
                      <p className="font-medium text-slate-800">{item.jobs.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.jobs.company}</p>
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs">Job deleted</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={item.type === 'scam' ? 'destructive' : 'outline'} className="rounded-full">
                    {FEEDBACK_TYPE_LABELS[item.type] || item.type}
                  </Badge>
                </td>
                <td className="px-5 py-4 max-w-xs">
                  <p className="truncate text-slate-600">
                    {item.message || <span className="text-slate-400">No message</span>}
                  </p>
                </td>
                <td className="px-5 py-4">
                  {item.email ? (
                    <a href={`mailto:${item.email}`} className="text-primary hover:underline text-xs">{item.email}</a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={STATUS_VARIANTS[item.status] || 'secondary'} className="rounded-full capitalize">
                    {item.status}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-xs text-slate-400">
                  {formatDate(item.created_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    {item.status === 'new' && (
                      <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(item.id, 'reviewed')}>
                        Review
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {feedback.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          No feedback submitted yet
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Showing {feedback.length} of {totalCount} items
        </p>
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/feedback" />
      </div>
    </>
  )
}
