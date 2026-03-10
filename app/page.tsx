'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { JobDetailPanel } from '@/components/jobs/job-detail-panel'
import { JobsHeader } from '@/components/jobs/jobs-header'
import { JobCard } from '@/components/jobs/job-card'
import type { Job } from '@/lib/types'

const JOBS_PER_PAGE = 25

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [totalJobs, setTotalJobs] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    job_type: '',
    work_mode: '',
    location: '',
  })

  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE)

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const from = (currentPage - 1) * JOBS_PER_PAGE
    const to = from + JOBS_PER_PAGE - 1

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('posted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%`)
    }

    if (filters.job_type) {
      query = query.eq('job_type', filters.job_type)
    }

    if (filters.work_mode) {
      query = query.eq('work_mode', filters.work_mode)
    }

    const { data, count } = await query

    if (data) {
      setJobs(data as Job[])
      setTotalJobs(count || 0)
      // Select first job on initial load or page change
      if (data.length > 0) {
        setSelectedJob(data[0] as Job)
      } else {
        setSelectedJob(null)
      }
    }
    setIsLoading(false)
  }, [filters, currentPage])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.search, filters.job_type, filters.work_mode])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Main Content Area */}
      <div className="flex flex-col min-w-0">
        {/* Header */}
        <JobsHeader
          totalJobs={totalJobs}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Content - Flipped layout: cards left, details right */}
        <div className="flex-1 flex px-8 lg:px-12 pb-6 pt-4 gap-6 max-w-[1600px] mx-auto w-full items-start">
          {/* Left Panel - Job Cards */}
          <div className="w-[420px] shrink-0">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <select
                value={filters.job_type}
                onChange={(e) => handleFilterChange('job_type', e.target.value)}
                className="h-9 px-3 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="internship">Internship</option>
                <option value="graduate">Graduate</option>
                <option value="part-time">Part-time</option>
                <option value="full-time">Full-time</option>
                <option value="casual">Casual</option>
                <option value="contract">Contract</option>
              </select>
              <select
                value={filters.work_mode}
                onChange={(e) => handleFilterChange('work_mode', e.target.value)}
                className="h-9 px-3 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="">All Locations</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            {/* Job Cards List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3 animate-spin" />
                  Loading jobs...
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500">
                  No jobs found
                </div>
              ) : (
                jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={selectedJob?.id === job.id}
                    onClick={() => handleJobSelect(job)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Job Details (Main Visual) */}
          <div className="flex-1 min-w-0 self-start sticky top-24">
            <AnimatePresence mode="wait">
              {selectedJob ? (
                <motion.div
                  key={selectedJob.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35
                  }}
                >
                  <JobDetailPanel job={selectedJob} isMainView />
                </motion.div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-slate-400">
                  Select a job to view details
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
