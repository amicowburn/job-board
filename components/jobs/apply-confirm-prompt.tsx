'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { trackEvent } from '@/lib/analytics/track'
import {
  clearPendingApply,
  nextApplyToConfirm,
  type PendingApply,
} from '@/lib/analytics/pending-applies'

/**
 * Asks a returning visitor whether they finished an application.
 *
 * Apply links open in a new tab, so the board tab is still sitting there when
 * the visitor comes back — that refocus is the trigger. It also checks on mount,
 * which covers the visitor who closed the tab entirely and returned later.
 *
 * Deliberately answerable and dismissable in one click, and it never blocks
 * anything: this is a question the board asks for its own benefit, so it should
 * cost the job seeker as close to nothing as possible. Either answer clears the
 * entry, so nobody is asked about the same job twice.
 *
 * Rendered with a plain conditional and a CSS entrance rather than
 * framer-motion's AnimatePresence, which is used elsewhere in this directory.
 * With presence tracking the answered prompt stayed in the DOM at full opacity
 * — the exit never ran — and the next one stacked up behind it. A dialog that
 * reliably closes matters more than an exit animation.
 */
export function ApplyConfirmPrompt() {
  const [pending, setPending] = useState<PendingApply | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Keeps the toast from sitting on top of the last job card: while it's
  // visible, pad any feed container by exactly this panel's own rendered
  // height (plus a small clearance) rather than a guessed fixed value.
  useEffect(() => {
    const feeds = document.querySelectorAll<HTMLElement>('[data-job-feed]')

    if (pending && panelRef.current) {
      const clearance = panelRef.current.offsetHeight + 24
      feeds.forEach((feed) => { feed.style.paddingBottom = `${clearance}px` })
    } else {
      feeds.forEach((feed) => { feed.style.paddingBottom = '' })
    }

    return () => {
      feeds.forEach((feed) => { feed.style.paddingBottom = '' })
    }
  }, [pending])

  const check = useCallback(() => {
    // Never replace a prompt that is already on screen — swapping the question
    // out from under someone mid-click would record the wrong answer.
    setPending((current) => current ?? nextApplyToConfirm(Date.now()))
  }, [])

  useEffect(() => {
    check()

    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }

    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisible)

    // Backstop for the visitor who never leaves the tab: an entry only becomes
    // eligible once it is old enough, and no focus event may ever fire.
    const timer = window.setInterval(check, 20_000)

    return () => {
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [check])

  const answer = (applied: boolean) => {
    if (!pending) return
    if (applied) trackEvent('apply_confirmed', pending.jobId)
    clearPendingApply(pending.jobId)
    setPending(null)
  }

  if (!pending) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Confirm application"
      className="fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px] bg-white rounded-2xl border border-slate-200 shadow-lg p-4 motion-safe:animate-apply-prompt-in"
    >
      <button
        onClick={() => answer(false)}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <p
        className="text-sm font-semibold text-slate-800 pr-6"
        style={{ fontFamily: 'var(--font-outfit)' }}
      >
        Did you finish applying?
      </p>
      <p className="text-xs text-slate-500 mt-1 leading-snug">
        {pending.title} at {pending.company}
      </p>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => answer(true)}
          className="flex-1 bg-primary hover:bg-primary/90 text-white text-sm font-medium py-2 px-3 rounded-xl transition-colors"
        >
          Yes, I applied
        </button>
        <button
          onClick={() => answer(false)}
          className="flex-1 text-slate-600 hover:bg-slate-100 text-sm font-medium py-2 px-3 rounded-xl border border-slate-200 transition-colors"
        >
          Not yet
        </button>
      </div>

      <p className="text-[10px] text-slate-400 mt-2.5 leading-snug">
        Helps us show students which listings actually lead somewhere.
      </p>
    </div>
  )
}
