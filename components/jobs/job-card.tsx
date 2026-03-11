'use client'

import { formatRelativeTime } from '@/lib/utils'
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

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const truncateDescription = (desc: string | null, maxLength: number = 100) => {
    if (!desc) return null
    const plain = stripHtml(desc)
    if (plain.length <= maxLength) return plain
    return plain.substring(0, maxLength).trim() + '...'
  }

  const timeAgo = job.posted_at
    ? formatRelativeTime(job.posted_at)
    : job.created_at
    ? formatRelativeTime(job.created_at)
    : null

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all border ${
        isSelected
          ? 'bg-white border-slate-300 shadow-sm'
          : 'bg-[#f2f2f2] hover:bg-white border-transparent hover:border-slate-200'
      }`}
    >
      <div className="flex gap-3">
        {/* Company Logo/Initials */}
        {job.company_logo_url ? (
          <img
            src={job.company_logo_url}
            alt={job.company}
            className="w-10 h-10 rounded-lg object-contain shrink-0 border border-slate-200 bg-white"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700 shrink-0">
            {getInitials(job.company)}
          </div>
        )}

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight text-slate-900 truncate">
                {job.title}
              </h3>
              <p className="text-xs mt-0.5 text-slate-500">
                {job.company}
              </p>
            </div>
            {timeAgo && (
              <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">
                {timeAgo}
              </span>
            )}
          </div>

          {/* Description Preview */}
          {job.description && (
            <p className="text-xs mt-1.5 leading-relaxed line-clamp-2 text-slate-400">
              {truncateDescription(job.description, 120)}
            </p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {job.job_type && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                {formatJobType(job.job_type)}
              </span>
            )}
            {job.work_mode && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                {job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)}
              </span>
            )}
            {job.location && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                {job.location.length > 20 ? job.location.substring(0, 20) + '...' : job.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
