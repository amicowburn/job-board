'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Badge, Input, Alert, AlertDescription } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Job } from '@/lib/types'

interface JobTableProps {
  jobs: Job[]
  totalJobs: number
}

export function JobTable({ jobs, totalJobs }: JobTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkDays, setBulkDays] = useState('30')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleSelect = (jobId: string) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(filteredJobs.map((j) => j.id)))
    }
  }

  const handleDeactivate = async (jobId: string) => {
    if (!confirm('Are you sure you want to deactivate this job?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .eq('id', jobId)

    if (error) {
      setError('Failed to deactivate job')
    } else {
      setSuccess('Job deactivated')
      startTransition(() => router.refresh())
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to permanently delete this job? This action cannot be undone.')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      setError('Failed to delete job')
    } else {
      setSuccess('Job deleted')
      startTransition(() => router.refresh())
    }
  }

  const handleBulkDeactivate = async () => {
    const days = parseInt(bulkDays, 10)
    if (isNaN(days) || days < 1) {
      setError('Please enter a valid number of days')
      return
    }

    if (!confirm(`This will deactivate all jobs older than ${days} days or with a closing date in the past. Continue?`)) return

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const supabase = createClient()

    // Deactivate old jobs
    const { error: oldError } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .lt('created_at', cutoffDate.toISOString())
      .eq('is_active', true)

    // Deactivate jobs with past closing date
    const { error: closedError } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .lt('closing_at', new Date().toISOString())
      .eq('is_active', true)

    if (oldError || closedError) {
      setError('Failed to deactivate some jobs')
    } else {
      setSuccess('Old and expired jobs deactivated')
      setShowBulkActions(false)
      startTransition(() => router.refresh())
    }
  }

  const handleBulkDeactivateSelected = async () => {
    if (selectedJobs.size === 0) return
    if (!confirm(`Deactivate ${selectedJobs.size} selected jobs?`)) return

    const supabase = createClient()
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .in('id', Array.from(selectedJobs))

    if (error) {
      setError('Failed to deactivate jobs')
    } else {
      setSuccess(`${selectedJobs.size} jobs deactivated`)
      setSelectedJobs(new Set())
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkActions(!showBulkActions)}
          >
            Bulk Actions
          </Button>
          <Link href="/admin/jobs/new">
            <Button variant="primary">Add Job</Button>
          </Link>
        </div>
      </div>

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

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <div className="p-4 bg-muted rounded-lg border space-y-4">
          <h3 className="font-medium">Bulk Actions</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={bulkDays}
                onChange={(e) => setBulkDays(e.target.value)}
                className="w-20"
                min="1"
              />
              <span className="text-sm text-muted-foreground">days old</span>
              <Button variant="outline" onClick={handleBulkDeactivate}>
                Deactivate Old Jobs
              </Button>
            </div>
            {selectedJobs.size > 0 && (
              <Button variant="outline" onClick={handleBulkDeactivateSelected}>
                Deactivate Selected ({selectedJobs.size})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Job</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Posted</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredJobs.map((job) => (
                <tr key={job.id} className={isPending ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedJobs.has(job.id)}
                      onChange={() => handleToggleSelect(job.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-muted-foreground">{job.company}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={job.source === 'manual' ? 'secondary' : 'outline'}>
                      {job.source}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Badge variant={job.is_active ? 'success' : 'destructive'}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {job.is_featured && <Badge variant="warning">Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(job.posted_at || job.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/jobs/${job.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      {job.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(job.id)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(job.id)}
                        >
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
          <div className="text-center py-8 text-muted-foreground">
            {search ? 'No jobs match your search' : 'No jobs found'}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredJobs.length} of {totalJobs} jobs
      </p>
    </div>
  )
}
