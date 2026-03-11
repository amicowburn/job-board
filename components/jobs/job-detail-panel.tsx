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
  const [showFeedback, setShowFeedback] = useState(false)
  const [copied, setCopied] = useState(false)

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
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                {job.title}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {job.company}
              </p>
            </div>
            {job.company_logo_url ? (
              <img
                src={job.company_logo_url}
                alt={job.company}
                className="w-12 h-12 rounded-xl object-contain shrink-0 border border-slate-200 bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-sm font-semibold text-purple-700 shrink-0 border border-purple-200">
                {getInitials(job.company)}
              </div>
            )}
          </div>

          {/* Info pills row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {job.location && (
              <span className="inline-flex items-center text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                <LocationIcon className="w-3 h-3 mr-1.5" />
                {job.location}
              </span>
            )}
            {job.job_type && (
              <span className="inline-flex items-center text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1).replace('-', ' ')}
              </span>
            )}
            {job.work_mode && (
              <span className="inline-flex items-center text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                {job.work_mode === 'remote' && <RemoteIcon className="w-3 h-3 mr-1.5" />}
                {job.work_mode === 'hybrid' && <HybridIcon className="w-3 h-3 mr-1.5" />}
                {job.work_mode === 'onsite' && <OnsiteIcon className="w-3 h-3 mr-1.5" />}
                {job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)}
              </span>
            )}
            {job.tags && job.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Description - scrollable */}
        <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {job.description ? (
            <div>
              <h2 className="text-sm font-semibold text-slate-800 mb-2">Job Description</h2>
              <div
                className="prose prose-sm max-w-none text-slate-600 prose-headings:text-slate-800 prose-a:text-primary prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">
                No description available for this role.
              </p>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary font-medium text-sm mt-2 hover:underline"
              >
                View full details on company website
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Feedback */}
          <div className="mt-6 pt-4 border-t border-slate-100">
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
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
                >
                  <FlagIcon className="w-3.5 h-3.5" />
                  Report an issue with this listing
                </button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sticky Apply Button */}
        <div className="p-4 border-t border-slate-200 bg-white flex gap-3">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-6 rounded-xl text-center transition-colors text-sm inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Apply Now
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(job.url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className={`px-4 py-2.5 rounded-xl border transition-all text-sm inline-flex items-center gap-2 ${
              copied
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    )
  }

  // Compact sidebar view (fallback)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="p-6 text-center border-b border-slate-100">
        <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center bg-purple-100 text-purple-700 font-semibold text-lg border border-purple-200">
          {getInitials(job.company)}
        </div>
        <h2 className="text-lg font-semibold text-slate-800">{job.company}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="font-semibold text-slate-800">{job.title}</h3>
        <p className="text-sm text-slate-500 mt-1">{job.location || 'Location not specified'}</p>
        {job.description && (
          <p className="text-sm text-slate-600 leading-relaxed mt-4">
            {job.description.substring(0, 300)}
            {job.description.length > 300 && '...'}
          </p>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 flex gap-3">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-xl text-center transition-colors text-sm"
        >
          Apply Now
        </a>
      </div>
    </div>
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
