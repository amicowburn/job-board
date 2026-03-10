'use client'

interface JobsHeaderProps {
  totalJobs: number
  filters: {
    search: string
    job_type: string
    work_mode: string
    location: string
  }
  onFilterChange: (key: string, value: string) => void
}

export function JobsHeader({ totalJobs, filters, onFilterChange }: JobsHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-4xl mx-auto text-center mb-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">MMSS JOB BOARD</h1>
        <p className="text-sm text-slate-500 mt-1">
          {totalJobs.toLocaleString()} jobs available for marketing students
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center bg-slate-50 rounded-md border border-slate-200 overflow-hidden focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-200 transition-all">
          <div className="pl-4 text-slate-400">
            <SearchIcon className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Job title, company, keywords..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="flex-1 h-12 px-4 bg-transparent border-0 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
          />
          <button className="h-12 px-6 text-sm font-medium text-slate-600 hover:text-slate-800 border-l border-slate-200 flex items-center gap-2 transition-colors">
            Advanced Search
            <ChevronDownIcon className="w-4 h-4" />
          </button>
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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}
