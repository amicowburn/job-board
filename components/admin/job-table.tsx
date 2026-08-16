'use client'

import { useOptimistic, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { CurrencyCircleDollarIcon } from '@phosphor-icons/react'
import { Button, Badge, Input, useConfirmDialog } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shadcn/tooltip'
import { GridRow, StatusDot } from './table'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate } from '@/lib/utils'
import { BulkImport } from './bulk-import'
import type { AdminJobRow } from '@/lib/types'

/** Literal so Tailwind's JIT scanner can see it — see components/admin/table/grid-row.tsx.
 *  checkbox / job / status / posted / actions. No Source track: Phase 3 folds source into
 *  the job cell's secondary line instead of giving it its own column. */
const JOB_GRID_COLUMNS = 'grid-cols-[22px_minmax(0,1fr)_96px_84px_76px]'

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
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:w-64">
          <Input
            type="search"
            placeholder="Search this page..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-full border-[0.5px] border-border bg-transparent pr-8 text-sm"
          />
          {/* Decorative — the input itself is the whole hit target, this
              just labels it visually. Not a button: nothing to click here. */}
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent"
            onClick={() => setShowBulkActions(!showBulkActions)}
          >
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
          <h3 className="text-sm font-semibold text-slate-700 font-heading">
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

      {/* Grid — desktop. Fixed 5-column template (checkbox / job / status /
          posted / actions); see JOB_GRID_COLUMNS above for why there's no
          separate Source track. */}
      <div className="hidden md:block">
        <GridRow header columnsClassName={JOB_GRID_COLUMNS}>
          <div className="px-5 py-3 flex items-center">
            <input
              type="checkbox"
              checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
              onChange={handleSelectAll}
              className="rounded border-slate-300"
            />
          </div>
          <div className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 font-medium">Job</div>
          <div className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 font-medium">Status</div>
          <div className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 font-medium">Posted</div>
          <div className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 font-medium">Actions</div>
        </GridRow>

        {filteredJobs.map((job) => (
          <GridRow key={job.id} columnsClassName={JOB_GRID_COLUMNS}>
            <div className="px-5 py-4 flex items-center">
              <input
                type="checkbox"
                checked={selectedJobs.has(job.id)}
                onChange={() => handleToggleSelect(job.id)}
                className="rounded border-slate-300"
              />
            </div>
            <div className={cn('min-w-0 px-5 py-4', !job.is_active && 'text-slate-400')}>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className={cn('text-sm font-medium truncate', job.is_active && 'text-slate-800')}>
                    {job.title}
                  </p>
                  {job.is_sponsored && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          role="img"
                          aria-label="Sponsored"
                          tabIndex={0}
                          className={cn('shrink-0 inline-flex', job.is_active ? 'text-primary' : 'text-slate-400')}
                        >
                          <CurrencyCircleDollarIcon weight="fill" className="size-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Sponsored</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {[job.company, job.source].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center gap-1.5">
              <StatusDot
                role={job.is_active ? 'success' : 'muted'}
                label={job.is_active ? 'Active' : 'Inactive'}
              />
            </div>
            <div className="pr-4 py-4 flex items-center justify-end text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(job.posted_at || job.created_at)}
            </div>
            <div className="py-4 flex items-center gap-1">
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
          </GridRow>
        ))}
      </div>

      {/* Cards — mobile. Same data, same badge variants, same action logic
          and selection state as the table above — bulk select-and-deactivate
          works identically here, not a reduced feature set.
          Each job is one record, not three stacked rows: title/company +
          checkbox share a baseline-aligned top row, source+status badges
          sit together directly below, and date+actions close it out. Cards
          get their own border/radius and 12px gaps (space-y-3) rather than
          divide-y, so more than two fit on screen without reading as a
          single dense strip. */}
      <div className="md:hidden p-4 space-y-3">
        {filteredJobs.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
              onChange={handleSelectAll}
              className="rounded border-slate-300"
            />
            <span className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">
              Select all
            </span>
          </div>
        )}
        {filteredJobs.map((job) => (
          <div key={job.id} className="rounded-xl border border-slate-100 p-3 space-y-2">
            {/* Title + company, checkbox aligned with the title's own line */}
            <div className="flex items-start justify-between gap-2">
              <div className={cn('min-w-0', !job.is_active && 'text-slate-400')}>
                <div className="flex items-center gap-1">
                  <p className={cn('font-medium leading-tight truncate', job.is_active && 'text-slate-800')}>
                    {job.title}
                  </p>
                  {job.is_sponsored && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          role="img"
                          aria-label="Sponsored"
                          tabIndex={0}
                          className={cn('shrink-0 inline-flex', job.is_active ? 'text-primary' : 'text-slate-400')}
                        >
                          <CurrencyCircleDollarIcon weight="fill" className="size-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Sponsored</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {[job.company, job.source].filter(Boolean).join(' · ')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={selectedJobs.has(job.id)}
                onChange={() => handleToggleSelect(job.id)}
                className="rounded border-slate-300 shrink-0"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge variant={job.is_active ? 'success' : 'destructive'} className="rounded-full">
                {job.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Date + actions, one row */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {formatDate(job.posted_at || job.created_at)}
              </span>
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
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          {search ? 'No jobs match your search on this page' : 'No jobs found'}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Showing {filteredJobs.length} of {totalJobs} jobs
        </p>
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/jobs" />
      </div>

      {dialog}
    </>
  )
}
