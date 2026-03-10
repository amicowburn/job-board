'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { FeedbackForm } from './feedback-form'
import type { Job } from '@/lib/types'

interface JobDetailPanelProps {
  job: Job
  isMainView?: boolean
}

export function JobDetailPanel({ job, isMainView = false }: JobDetailPanelProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const getCompanyColor = (_company: string) => {
    return 'bg-slate-700'
  }

  const getInitials = (company: string) => {
    return company
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  if (isMainView) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden min-h-[400px]">
          {/* Header Section - Compact */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Company Logo */}
                <div
                  className={cn(
                    'w-14 h-14 rounded-md flex items-center justify-center text-white font-semibold text-lg shrink-0',
                    getCompanyColor(job.company)
                  )}
                >
                  {getInitials(job.company)}
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold text-slate-900 leading-tight">
                    {job.title}
                  </h1>
                  <p className="text-base text-slate-600 mt-0.5">
                    {job.company}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap text-sm">
                    {job.location && (
                      <span className="inline-flex items-center text-slate-500">
                        <LocationIcon className="w-3.5 h-3.5 mr-1" />
                        {job.location}
                      </span>
                    )}
                    {job.job_type && (
                      <span className="text-slate-600 font-medium">
                        {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1).replace('-', ' ')}
                      </span>
                    )}
                    {job.work_mode && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        {job.work_mode === 'remote' && <RemoteIcon className="w-3 h-3 mr-1" />}
                        {job.work_mode === 'hybrid' && <HybridIcon className="w-3 h-3 mr-1" />}
                        {job.work_mode === 'onsite' && <OnsiteIcon className="w-3 h-3 mr-1" />}
                        {job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={cn(
                    'p-2.5 rounded-md transition-colors border',
                    isBookmarked ? 'bg-slate-100 text-slate-700 border-slate-300' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-slate-200'
                  )}
                >
                  <BookmarkIcon className="w-5 h-5" filled={isBookmarked} />
                </button>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-6 rounded-md transition-colors text-sm"
                >
                  Apply Now
                </a>
              </div>
            </div>
          </div>

          {/* Tags - Inline */}
          {job.tags && job.tags.length > 0 && (
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-white text-slate-600 rounded-md text-xs font-medium border border-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content Sections */}
          <div className="p-6 space-y-6">
            {/* Summary Section */}
            {job.description && (
              <section>
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-0.5 h-4 bg-slate-400"></span>
                  About this role
                </h2>
                <p className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </section>
            )}

            {!job.description && (
              <section className="text-center py-8">
                <p className="text-slate-500">
                  No description available for this role.
                </p>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary font-medium mt-2 hover:underline"
                >
                  View full details on company website
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </section>
            )}

            {/* Feedback Section */}
            <section className="pt-4 border-t border-slate-100">
              <AnimatePresence mode="wait">
                {showFeedback ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <FeedbackForm jobId={job.id} />
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
                  >
                    <FlagIcon className="w-4 h-4" />
                    Report an issue with this listing
                  </button>
                )}
              </AnimatePresence>
            </section>
          </div>
      </div>
    )
  }

  // Compact sidebar view (original)
  return (
    <div className="bg-white rounded-lg border border-slate-200 h-full flex flex-col overflow-hidden">
      {/* Company Header */}
      <div className="p-6 text-center border-b border-slate-200">
        <div
          className={cn(
            'w-16 h-16 rounded-md mx-auto mb-4 flex items-center justify-center text-white font-semibold text-xl',
            getCompanyColor(job.company)
          )}
        >
          {getInitials(job.company)}
        </div>
        <h2 className="text-lg font-semibold text-slate-800">
          {job.company}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {job.job_type ? job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1).replace('-', ' ') : 'Company'}
        </p>
      </div>

      {/* Job Details */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Job Title */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-semibold text-slate-800">{job.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{job.location || 'Location not specified'}</p>
          </div>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={cn(
              'p-2 rounded-md transition-colors',
              isBookmarked ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            )}
          >
            <BookmarkIcon className="w-5 h-5" filled={isBookmarked} />
          </button>
        </div>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {job.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {job.description ? (
              <>
                {job.description.substring(0, 300)}
                {job.description.length > 300 && (
                  <>
                    ...
                    <button className="text-primary font-medium ml-1 hover:underline">
                      Read more
                    </button>
                  </>
                )}
              </>
            ) : (
              'No description available. Click "Apply now" to learn more about this opportunity.'
            )}
          </p>
        </div>

        {/* Work Mode Badge */}
        {job.work_mode && (
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-slate-100 text-slate-600">
              {job.work_mode === 'remote' && <RemoteIcon className="w-4 h-4 mr-1.5" />}
              {job.work_mode === 'hybrid' && <HybridIcon className="w-4 h-4 mr-1.5" />}
              {job.work_mode === 'onsite' && <OnsiteIcon className="w-4 h-4 mr-1.5" />}
              {job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)}
            </span>
          </div>
        )}

        {/* Feedback Section */}
        <AnimatePresence mode="wait">
          {showFeedback ? (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FeedbackForm jobId={job.id} />
            </motion.div>
          ) : (
            <button
              onClick={() => setShowFeedback(true)}
              className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
              <FlagIcon className="w-4 h-4" />
              Report an issue
            </button>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-slate-200 flex gap-3">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-md text-center transition-colors"
        >
          Apply Now
        </a>
        <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-md transition-colors border border-slate-200">
          Save Job
        </button>
      </div>
    </div>
  )
}

function BookmarkIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function RemoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function HybridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function OnsiteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
        clipRule="evenodd"
      />
    </svg>
  )
}
