import type { AnalyticsEventType, Granularity } from '@/lib/types'

/**
 * First-party cookie identifying an anonymous visitor.
 *
 * Lives in its own module because three runtimes need it — Edge middleware
 * mints it, the Node route handler reads it, and the browser tracker relies on
 * it existing — and none of them should have to import the others.
 */
export const VISITOR_COOKIE = 'mmss_vid'

/** One year. Long enough that "viewers this quarter" means returning people. */
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const EVENT_TYPES: readonly AnalyticsEventType[] = [
  'view',
  'click',
  'apply',
  'apply_confirmed',
  'share',
]

export const GRANULARITIES: readonly Granularity[] = ['week', 'month', 'quarter', 'year']

/**
 * Buckets shown per granularity.
 *
 * Tuned so each chart covers a comparable span of history without becoming
 * unreadable: 12 weeks is a semester, 12 months a year, 8 quarters two years.
 */
export const BUCKET_COUNT: Record<Granularity, number> = {
  week: 12,
  month: 12,
  quarter: 8,
  year: 5,
}

/**
 * Buckets are cut in Melbourne time, not UTC.
 *
 * This is a Monash society's job board: "this week" has to mean the week its
 * students are living in, or every Monday-morning number lands in the previous
 * bucket.
 */
export const REPORTING_TIMEZONE = 'Australia/Melbourne'

/**
 * Human labels.
 *
 * "Apply clicks" and "Applications" are deliberately different things: the
 * first is a visitor leaving for the employer, the second is a visitor coming
 * back and confirming they finished. Never collapse them into one number.
 */
export const ACTION_LABELS: Record<AnalyticsEventType, string> = {
  view: 'Job views',
  click: 'Job clicks',
  apply: 'Apply clicks',
  apply_confirmed: 'Applications',
  share: 'Shares',
}

/**
 * How long after an apply click the confirmation prompt stays relevant.
 *
 * The lower bound keeps the prompt from appearing while the employer's tab is
 * still opening — asking "did you apply?" two seconds after the click reads as
 * broken. The upper bound stops us asking about something from last week, which
 * the visitor will not remember accurately.
 */
export const APPLY_CONFIRM_MIN_AGE_MS = 45_000
export const APPLY_CONFIRM_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000
