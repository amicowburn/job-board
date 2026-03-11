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
  const [showDetail, setShowDetail] = useState(false)
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

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.search, filters.job_type, filters.work_mode])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job)
    setShowDetail(true)
  }

  const handleBack = () => {
    setShowDetail(false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[#e8e8e8] flex flex-col overflow-hidden">
      {/* Header - fixed at top */}
      <JobsHeader
        totalJobs={totalJobs}
        lastUpdated={jobs[0]?.posted_at || jobs[0]?.created_at || null}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Two-panel layout fills remaining height */}
      <div className="flex-1 flex px-4 sm:px-6 md:px-8 lg:px-12 pb-4 pt-2 gap-5 max-w-[1200px] mx-auto w-full min-h-0">
        {/* Left Panel - Job list with fixed pagination */}
        <div className={`w-full md:w-[380px] md:shrink-0 flex flex-col min-h-0 ${showDetail ? 'hidden md:flex' : 'flex'}`}>
          {/* Scrollable job cards */}
          <div data-lenis-prevent className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 min-h-0">
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

          {/* Post a job CTA */}
          <div className="shrink-0 py-3 text-center">
            <p className="text-xs text-slate-400">
              Want to post a job?{' '}
              <a href="mailto:enquires@monashmss.com" className="text-primary font-medium hover:underline">
                enquires@monashmss.com
              </a>
            </p>
          </div>

          {/* Pagination - pinned at bottom */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3 shrink-0 border-t border-slate-200/50">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-xs text-slate-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Job detail with internal scroll */}
        <div className={`flex-1 min-w-0 min-h-0 ${showDetail ? 'flex flex-col' : 'hidden md:block'}`}>
          <AnimatePresence mode="wait">
            {selectedJob ? (
              <motion.div
                key={selectedJob.id}
                className="h-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 35
                }}
              >
                <JobDetailPanel job={selectedJob} isMainView onBack={handleBack} />
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 h-full flex items-center justify-center">
                Select a job to view details
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
