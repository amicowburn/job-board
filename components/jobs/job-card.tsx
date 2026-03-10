'use client'

import type { Job } from '@/lib/types'

interface JobCardProps {
  job: Job
  isSelected: boolean
  onClick: () => void
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const getInitials = (company: string) => {
    return company
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatJobType = (type: string | null) => {
    if (!type) return ''
    return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
  }

  const truncateDescription = (desc: string | null, maxLength: number = 100) => {
    if (!desc) return null
    if (desc.length <= maxLength) return desc
    return desc.substring(0, maxLength).trim() + '...'
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-md transition-all border ${
        isSelected
          ? 'bg-slate-800 text-white border-slate-700'
          : 'bg-white hover:bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex gap-3">
        {/* Company Logo/Initials */}
        <div
          className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-semibold shrink-0 ${
            isSelected
              ? 'bg-white/10 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {getInitials(job.company)}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-[15px] leading-tight ${
            isSelected ? 'text-white' : 'text-slate-900'
          }`}>
            {job.title}
          </h3>
          <p className={`text-sm mt-0.5 ${
            isSelected ? 'text-white/80' : 'text-slate-500'
          }`}>
            {job.company}
          </p>

          {/* Description Preview */}
          {job.description && (
            <p className={`text-xs mt-2 leading-relaxed line-clamp-2 ${
              isSelected ? 'text-white/70' : 'text-slate-400'
            }`}>
              {truncateDescription(job.description, 120)}
            </p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {job.job_type && (
              <span className={`text-xs px-2 py-0.5 rounded-sm ${
                isSelected
                  ? 'bg-white/10 text-white/80'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {formatJobType(job.job_type)}
              </span>
            )}
            {job.work_mode && (
              <span className={`text-xs px-2 py-0.5 rounded-sm ${
                isSelected
                  ? 'bg-white/10 text-white/80'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)}
              </span>
            )}
            {job.location && (
              <span className={`text-xs px-2 py-0.5 rounded-sm ${
                isSelected
                  ? 'bg-white/10 text-white/80'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {job.location.length > 15 ? job.location.substring(0, 15) + '...' : job.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
