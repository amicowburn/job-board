import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { RANGE_GRANULARITY, REPORTING_TIMEZONE, resolveRange } from './constants'
import { bucketWindow, fillBuckets, normalizeActionCounts, shiftBucket, topInterests } from './buckets'
import { growthInsight } from './growth'
import type { GrowthInsight } from './growth'
import type { FilledBucket, InterestSlice } from './buckets'
import type { AnalyticsRange } from './constants'
import type { ActionCountRow, ActionCounts, InterestRow, ViewerBucket } from '@/lib/types'

/** Cache tag for the analytics dashboard. */
export const ANALYTICS_TAG = 'analytics'

/** How many labels each interest chart shows before folding the tail into "Other". */
const INTEREST_LIMIT = 8

/**
 * How many labels per dimension the database returns.
 *
 * Comfortably above INTEREST_LIMIT so the "Other" row is the real remainder
 * rather than the remainder of a truncated list, but still bounded — a job
 * board with thousands of distinct tags should not ship them all to the page.
 */
const INTEREST_FETCH_LIMIT = 50

export interface AnalyticsSnapshot {
  /** One bucket per day of the selected range, oldest first, gaps zero-filled. */
  dailyBuckets: FilledBucket[]
  jobTypes: InterestSlice[]
  tags: InterestSlice[]
  actions: ActionCounts
  /** Period-over-period movers, compared against the equal-length prior window. */
  jobTypeGrowth: GrowthInsight
  tagGrowth: GrowthInsight
  /** True when nothing was tracked in the window — the page says so rather than drawing empty axes. */
  isEmpty: boolean
}

/**
 * Everything the analytics dashboard renders, for one granularity.
 *
 * Cached across requests for the same reasons `getPendingSubmissionCount` is
 * (see lib/admin-data.ts): the numbers are identical for every admin, the page
 * is re-rendered on every navigation, and these are aggregate queries over a
 * table that only grows. It uses the service-role client deliberately — a
 * shared cache must not hold a value that depended on whose session filled it.
 *
 * There is no tag invalidation here, unlike the submissions count: events
 * arrive continuously from anonymous visitors, so there is no mutation to hang
 * a `revalidateTag` off. The 5-minute TTL is the whole correctness story, which
 * is fine for engagement reporting — nobody needs the click count to the second.
 *
 * Note `analytics_events` also carries an admin-only RLS SELECT policy, so the
 * anon key cannot read it even though this path bypasses RLS.
 */
export async function getAnalyticsSnapshot(
  range: AnalyticsRange
): Promise<AnalyticsSnapshot> {
  const { days } = resolveRange(range)

  const load = unstable_cache(
    async (): Promise<AnalyticsSnapshot> => {
      const supabase = createAdminClient()
      const args = {
        p_granularity: RANGE_GRANULARITY,
        p_buckets: days,
        p_tz: REPORTING_TIMEZONE,
      }

      // One round trip each, issued together — they share a window but not a
      // shape, and unioning them in SQL would mean reconciling three different
      // row types for no saving.
      const [interest, priorInterest, actions, daily, earliest] = await Promise.all([
        supabase.rpc('analytics_interest_breakdown', { ...args, p_limit: INTEREST_FETCH_LIMIT }),
        // The equal-length window immediately before this one. Offsetting by
        // the bucket count is what makes the growth figures period-over-period
        // rather than a comparison against an arbitrary earlier stretch.
        supabase.rpc('analytics_interest_breakdown', {
          ...args,
          p_limit: INTEREST_FETCH_LIMIT,
          p_offset_buckets: days,
        }),
        supabase.rpc('analytics_action_counts', args),
        // Daily series for the Total Visitors card, over the same window as
        // everything else. It used to fetch a fixed 90 days regardless, because
        // the card sliced its own shorter ranges client-side; with one control
        // for the page there is nothing left to slice.
        supabase.rpc('analytics_viewers_by_bucket', args),
        // Oldest event on record. Used to decide whether the previous window is
        // actually covered by tracked history — see below.
        supabase
          .from('analytics_events')
          .select('occurred_at')
          .order('occurred_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ])

      for (const { error } of [interest, priorInterest, actions, daily, earliest]) {
        if (error) {
          console.error('Analytics query failed:', error)
          throw new Error('Failed to load analytics')
        }
      }

      const interestRows = (interest.data ?? []) as InterestRow[]
      const priorInterestRows = (priorInterest.data ?? []) as InterestRow[]
      const actionRows = (actions.data ?? []) as ActionCountRow[]
      const dailyRows = (daily.data ?? []) as ViewerBucket[]

      // Does tracked history actually reach back far enough to compare against?
      // On the widest range the previous window starts six months back, which
      // can be before the first event ever recorded; the database returns a
      // near-empty window and the division produces figures like "+5462%
      // growth", which is not growth but the absence of history. Requiring full
      // coverage keeps the dashboard from inventing a trend out of a gap.
      const now = new Date()
      const previousWindowStart = shiftBucket(
        RANGE_GRANULARITY,
        bucketWindow(RANGE_GRANULARITY, days, now, REPORTING_TIMEZONE).start,
        -days,
        REPORTING_TIMEZONE
      )
      const earliestEvent = (earliest.data as { occurred_at: string } | null)?.occurred_at
      const historyCoversPreviousWindow =
        earliestEvent !== undefined && new Date(earliestEvent) <= previousWindowStart

      const jobTypes = topInterests(interestRows, 'job_type', INTEREST_LIMIT)
      const tags = topInterests(interestRows, 'tag', INTEREST_LIMIT)

      // Bucket labels are derived here, inside the cache, from the same instant
      // the SQL used. Deriving them at read time instead would silently break
      // the moment a cached payload outlived a bucket boundary: the axis would
      // advance, the rows would not, and every bar would render as zero.
      return {
        dailyBuckets: fillBuckets(dailyRows, RANGE_GRANULARITY, days, now, REPORTING_TIMEZONE),
        jobTypes,
        tags,
        actions: normalizeActionCounts(actionRows),
        // Growth is compared against the *unfolded* prior rows, not the top-N
        // slice: a category can drop out of the visible top N between windows,
        // and comparing against a truncated list would read that as a collapse.
        jobTypeGrowth: growthInsight(
          jobTypes,
          topInterests(priorInterestRows, 'job_type', INTEREST_FETCH_LIMIT),
          { subjectNoun: 'roles', historyCoversPreviousWindow }
        ),
        tagGrowth: growthInsight(
          tags,
          topInterests(priorInterestRows, 'tag', INTEREST_FETCH_LIMIT),
          { historyCoversPreviousWindow }
        ),
        isEmpty: actionRows.length === 0,
      }
    },
    ['analytics', range],
    { tags: [ANALYTICS_TAG], revalidate: 300 }
  )

  return load()
}
