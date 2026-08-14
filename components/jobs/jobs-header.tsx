'use client'

import Link from 'next/link'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { formatDate } from '@/lib/utils'

interface JobsHeaderProps {
  totalJobs: number
  lastUpdated?: string | null
  filters: {
    search: string
    job_type: string
    work_mode: string
    location: string
    sponsored: boolean
  }
  onFilterChange: (key: string, value: string) => void
  onSponsoredToggle: () => void
}

/**
 * The compact pill shape both filters share, overriding the field defaults.
 *
 * Background/border/ring-width now come from `NativeSelect`'s own palette
 * (matched to `components/shadcn/select.tsx`) rather than being repeated
 * here — only the slate focus color stays as an explicit override, to match
 * the neighboring search bar's `focus-within:ring-slate-200`/`border-slate-300`
 * above. That's a deliberate difference from the page body's brand-primary
 * `FILTER_FIELD` (see `app/jobs/page.tsx`), not something to reconcile away.
 *
 * The focus rules say `focus-visible:`, not `focus:`, because that is the
 * variant the component's own focus ring uses. Different variants do not
 * cancel each other out — they stack — so a `focus:ring-1` here would leave
 * the default `focus-visible:ring-3` drawn underneath, and the pill would
 * pick up a heavy double halo the moment it was clicked.
 */
const FILTER_PILL =
  'h-8 pl-2 sm:pl-3 pr-7 text-xs rounded-full ' +
  'focus-visible:ring-slate-300 focus-visible:border-slate-300 cursor-pointer'

export function JobsHeader({ totalJobs, lastUpdated, filters, onFilterChange, onSponsoredToggle }: JobsHeaderProps) {
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
          {/* Left and right padding are set separately, not as `px-*`: the
              right side is holding the chevron's space. */}
          <NativeSelect
            value={filters.job_type}
            onChange={(e) => onFilterChange('job_type', e.target.value)}
            className={FILTER_PILL}
          >
            <NativeSelectOption value="">All Types</NativeSelectOption>
            <NativeSelectOption value="internship">Internship</NativeSelectOption>
            <NativeSelectOption value="graduate">Graduate</NativeSelectOption>
            <NativeSelectOption value="part-time">Part-time</NativeSelectOption>
            <NativeSelectOption value="full-time">Full-time</NativeSelectOption>
            <NativeSelectOption value="casual">Casual</NativeSelectOption>
            <NativeSelectOption value="contract">Contract</NativeSelectOption>
          </NativeSelect>
          <NativeSelect
            value={filters.work_mode}
            onChange={(e) => onFilterChange('work_mode', e.target.value)}
            className={FILTER_PILL}
          >
            <NativeSelectOption value="">All Locations</NativeSelectOption>
            <NativeSelectOption value="remote">Remote</NativeSelectOption>
            <NativeSelectOption value="hybrid">Hybrid</NativeSelectOption>
            <NativeSelectOption value="onsite">On-site</NativeSelectOption>
          </NativeSelect>
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
