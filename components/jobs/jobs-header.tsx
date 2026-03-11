'use client'

import { formatDate } from '@/lib/utils'

interface JobsHeaderProps {
  totalJobs: number
  lastUpdated?: string | null
  filters: {
    search: string
    job_type: string
    work_mode: string
    location: string
  }
  onFilterChange: (key: string, value: string) => void
}

export function JobsHeader({ totalJobs, lastUpdated, filters, onFilterChange }: JobsHeaderProps) {
  return (
    <header className="px-4 sm:px-6 md:px-8 lg:px-12 pt-4 pb-2 max-w-[1200px] mx-auto w-full">
      {/* Title + Search + Last updated */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
        <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight shrink-0" style={{ fontFamily: 'var(--font-outfit)' }}>
          MMSS Job Board
        </h1>
        <div className="flex-1 flex items-center bg-white rounded-full border border-slate-200 overflow-hidden focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-200 transition-all shadow-sm">
          <div className="pl-3 sm:pl-4 text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search company or role..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="flex-1 h-10 px-3 bg-transparent border-0 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
        {lastUpdated && (
          <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
            Last updated {formatDate(lastUpdated)}
          </span>
        )}
      </div>

      {/* Result count + Filters row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-600 shrink-0">
          {totalJobs.toLocaleString()} {totalJobs === 1 ? 'Result' : 'Results'}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={filters.job_type}
            onChange={(e) => onFilterChange('job_type', e.target.value)}
            className="h-8 px-2 sm:px-3 text-xs text-slate-600 bg-white border border-slate-200 rounded-full focus:ring-1 focus:ring-slate-200 focus:border-slate-300 cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="internship">Internship</option>
            <option value="graduate">Graduate</option>
            <option value="part-time">Part-time</option>
            <option value="full-time">Full-time</option>
            <option value="casual">Casual</option>
            <option value="contract">Contract</option>
          </select>
          <select
            value={filters.work_mode}
            onChange={(e) => onFilterChange('work_mode', e.target.value)}
            className="h-8 px-2 sm:px-3 text-xs text-slate-600 bg-white border border-slate-200 rounded-full focus:ring-1 focus:ring-slate-200 focus:border-slate-300 cursor-pointer"
          >
            <option value="">All Locations</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </div>
      </div>
    </header>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
