'use client'

import { cn } from '@/lib/utils'
import type { Job } from '@/lib/types'

interface JobListItemProps {
  job: Job
  isSelected: boolean
  onClick: () => void
}

export function JobListItem({ job, isSelected, onClick }: JobListItemProps) {
  // Generate a muted color based on company name for the logo
  const getCompanyColor = (_company: string) => {
    return 'bg-slate-600'
  }

  const getInitials = (company: string) => {
    return company
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-3 text-left transition-colors duration-150 relative hover:bg-slate-50',
        isSelected && 'bg-slate-100'
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-0.5 bg-slate-700 transition-transform duration-200 origin-left',
          isSelected ? 'scale-x-100' : 'scale-x-0'
        )}
      />

      {/* Company Logo */}
      <div
        className={cn(
          'w-10 h-10 rounded-md flex items-center justify-center text-white font-semibold text-sm shrink-0',
          getCompanyColor(job.company)
        )}
      >
        {getInitials(job.company)}
      </div>

      {/* Job Info */}
      <div className="flex-1 min-w-0 grid grid-cols-3 gap-4 items-center">
        <div className="col-span-1">
          <h3 className="font-medium text-slate-800 truncate">{job.title}</h3>
          <p className="text-sm text-slate-500 truncate">{job.company}</p>
        </div>

        <div className="col-span-1">
          <p className="text-sm text-slate-700">{job.location || 'Location not specified'}</p>
          <p className="text-xs text-slate-400">Location</p>
        </div>

        <div className="col-span-1">
          <p className="text-sm text-slate-700 capitalize">
            {job.job_type?.replace('-', ' ') || 'Not specified'}
          </p>
          <p className="text-xs text-slate-400">
            {job.work_mode ? job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1) : 'Work mode'}
          </p>
        </div>
      </div>

      {/* Arrow indicator */}
      <div className={cn(
        'text-slate-300 transition-all duration-150',
        isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
      )}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9,18 15,12 9,6" />
        </svg>
      </div>
    </button>
  )
}
