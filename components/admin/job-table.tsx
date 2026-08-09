'use client'

import { useOptimistic, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Badge, Input, useConfirmDialog } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { BulkImport } from './bulk-import'
import type { AdminJobRow } from '@/lib/types'

interface JobTableProps {
  jobs: AdminJobRow[]
  totalJobs: number
  currentPage: number
  totalPages: number
}

/** Optimistic edits applied on top of the server-rendered rows. */
type JobAction =
  | { type: 'delete'; ids: string[] }
  | { type: 'deactivate'; ids: string[] }

function applyJobAction(rows: AdminJobRow[], action: JobAction): AdminJobRow[] {
  const ids = new Set(action.ids)

  if (action.type === 'delete') {
    return rows.filter((job) => !ids.has(job.id))
  }

  return rows.map((job) =>
    ids.has(job.id) ? { ...job, is_active: false } : job
  )
}

export function JobTable({ jobs, totalJobs, currentPage, totalPages }: JobTableProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkDays, setBulkDays] = useState('30')
  const { confirm, dialog } = useConfirmDialog()

  // Rows the user sees: server data plus any in-flight change. React discards
  // the optimistic layer when the surrounding transition settles, so a failed
  // mutation restores the real row on its own — we only surface the error.
  const [optimisticJobs, applyOptimistic] = useOptimistic(jobs, applyJobAction)

  const filteredJobs = optimisticJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleSelect = (jobId: string) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) setSelectedJobs(new Set())
    else setSelectedJobs(new Set(filteredJobs.map((j) => j.id)))
  }

  const handleDeactivate = async (jobId: string) => {
    const { confirmed } = await confirm({
      title: 'Deactivate this job?',
      description: 'It is removed from the public board but kept here, so you can reactivate it later.',
      confirmLabel: 'Deactivate',
    })
    if (!confirmed) return

    startTransition(async () => {
      applyOptimistic({ type: 'deactivate', ids: [jobId] })

      const supabase = createClient()
      const { error } = await supabase.from('jobs').update({ is_active: false }).eq('id', jobId)

      if (error) {
        toast.error('Failed to deactivate job', { description: error.message })
        return
      }

      toast.success('Job deactivated')
      router.refresh()
    })
  }

  const handleDelete = async (jobId: string) => {
    const { confirmed } = await confirm({
      title: 'Delete this job permanently?',
      description: 'The listing is removed from the database entirely.',
      warning: 'This cannot be undone. To take it off the board temporarily, deactivate it instead.',
      confirmLabel: 'Delete permanently',
      destructive: true,
    })
    if (!confirmed) return

    startTransition(async () => {
      applyOptimistic({ type: 'delete', ids: [jobId] })

      const supabase = createClient()
      const { error } = await supabase.from('jobs').delete().eq('id', jobId)

      if (error) {
        toast.error('Failed to delete job', { description: error.message })
        return
      }

      toast.success('Job deleted')
      router.refresh()
    })
  }

  const handleBulkDeactivate = async () => {
    const days = parseInt(bulkDays, 10)
    if (isNaN(days) || days < 1) {
      toast.error('Please enter a valid number of days')
      return
    }
    const { confirmed } = await confirm({
      title: `Deactivate jobs older than ${days} days?`,
      description: 'Also deactivates any job whose closing date has already passed.',
      warning: 'This affects every matching job on the board, not just the ones on this page.',
      confirmLabel: 'Deactivate them',
      destructive: true,
    })
    if (!confirmed) return

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    startTransition(async () => {
      // Server-side predicate — which rows match is not known here, so this one
      // stays non-optimistic and reconciles from the refresh.
      const supabase = createClient()
      const [{ error: oldError }, { error: closedError }] = await Promise.all([
        supabase.from('jobs').update({ is_active: false }).lt('created_at', cutoffDate.toISOString()).eq('is_active', true),
        supabase.from('jobs').update({ is_active: false }).lt('closing_at', new Date().toISOString()).eq('is_active', true),
      ])

      if (oldError || closedError) {
        toast.error('Failed to deactivate some jobs', {
          description: (oldError ?? closedError)?.message,
        })
        return
      }

      setShowBulkActions(false)
      toast.success('Old and expired jobs deactivated')
      router.refresh()
    })
  }

  const handleBulkDeactivateSelected = async () => {
    if (selectedJobs.size === 0) return
    const { confirmed } = await confirm({
      title: `Deactivate ${selectedJobs.size} selected ${selectedJobs.size === 1 ? 'job' : 'jobs'}?`,
      description: 'They are removed from the public board but kept here.',
      confirmLabel: 'Deactivate',
    })
    if (!confirmed) return

    const ids = Array.from(selectedJobs)

    startTransition(async () => {
      applyOptimistic({ type: 'deactivate', ids })

      const supabase = createClient()
      const { error } = await supabase.from('jobs').update({ is_active: false }).in('id', ids)

      if (error) {
        toast.error('Failed to deactivate jobs', { description: error.message })
        return
      }

      setSelectedJobs(new Set())
      toast.success(`${ids.length} jobs deactivated`)
      router.refresh()
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
        <Input
          type="search"
          placeholder="Search this page..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 h-9 text-sm"
        />
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowBulkActions(!showBulkActions)}>
            Bulk Actions
          </Button>
          <Link href="/admin/jobs/new">
            <Button variant="primary" size="sm">Add Job</Button>
          </Link>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'var(--font-outfit)' }}>
            Bulk Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Input type="number" value={bulkDays} onChange={(e) => setBulkDays(e.target.value)} className="w-20 h-9 text-sm" min="1" />
              <span className="text-sm text-slate-500">days old</span>
              <Button variant="outline" size="sm" onClick={handleBulkDeactivate}>Deactivate Old Jobs</Button>
            </div>
            {selectedJobs.size > 0 && (
              <Button variant="outline" size="sm" onClick={handleBulkDeactivateSelected}>
                Deactivate Selected ({selectedJobs.size})
              </Button>
            )}
          </div>
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Bulk Import from Excel</h4>
            <p className="text-xs text-slate-500 mb-3">
              Download the template, fill in your job postings, then upload to import them all at once.
            </p>
            <BulkImport />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Job</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Source</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Posted</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredJobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={selectedJobs.has(job.id)}
                    onChange={() => handleToggleSelect(job.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-800">{job.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{job.company}</p>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={job.source === 'manual' ? 'secondary' : 'outline'} className="rounded-full">
                    {job.source}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={job.is_active ? 'success' : 'destructive'} className="rounded-full">
                      {job.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {job.is_featured && <Badge variant="warning" className="rounded-full">Featured</Badge>}
                    {job.is_sponsored && <Badge variant="default" className="rounded-full">Sponsored</Badge>}
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-slate-400">
                  {formatDate(job.posted_at || job.created_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <Link href={`/admin/jobs/${job.id}/edit`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    {job.is_active ? (
                      <Button variant="ghost" size="sm" onClick={() => handleDeactivate(job.id)}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(job.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          {search ? 'No jobs match your search on this page' : 'No jobs found'}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Showing {filteredJobs.length} of {totalJobs} jobs
        </p>
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/jobs" />
      </div>

      {dialog}
    </>
  )
}
