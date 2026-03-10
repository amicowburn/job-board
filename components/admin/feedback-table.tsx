'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Badge, Alert, AlertDescription } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { JobFeedback, Job } from '@/lib/types'

interface FeedbackWithJob extends JobFeedback {
  jobs: Pick<Job, 'id' | 'title' | 'company'> | null
}

interface FeedbackTableProps {
  feedback: FeedbackWithJob[]
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

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleUpdateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('job_feedback')
      .update({ status } as { status: string })
      .eq('id', id)

    if (error) {
      setError('Failed to update status')
    } else {
      setSuccess('Status updated')
      startTransition(() => router.refresh())
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('job_feedback')
      .delete()
      .eq('id', id)

    if (error) {
      setError('Failed to delete feedback')
    } else {
      setSuccess('Feedback deleted')
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
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

      {/* Table */}
      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Job</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Message</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {feedback.map((item) => (
                <tr key={item.id} className={isPending ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    {item.jobs ? (
                      <Link
                        href={`/admin/jobs/${item.jobs.id}/edit`}
                        className="hover:underline"
                      >
                        <p className="font-medium">{item.jobs.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.jobs.company}
                        </p>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        Job deleted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={item.type === 'scam' ? 'destructive' : 'outline'}
                    >
                      {FEEDBACK_TYPE_LABELS[item.type] || item.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate">
                      {item.message || <span className="text-muted-foreground">No message</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {item.email ? (
                      <a
                        href={`mailto:${item.email}`}
                        className="text-primary hover:underline"
                      >
                        {item.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[item.status] || 'secondary'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {item.status === 'new' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(item.id, 'reviewed')}
                        >
                          Review
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
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
          <div className="text-center py-8 text-muted-foreground">
            No feedback submitted yet
          </div>
        )}
      </div>
    </div>
  )
}
