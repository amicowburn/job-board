import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { BUCKET_COUNT, REPORTING_TIMEZONE } from './constants'
import { fillBuckets, normalizeActionCounts, topInterests } from './buckets'
import type { FilledBucket, InterestSlice } from './buckets'
import type { ActionCountRow, ActionCounts, Granularity, InterestRow, ViewerBucket } from '@/lib/types'

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
  buckets: FilledBucket[]
  jobTypes: InterestSlice[]
  tags: InterestSlice[]
  actions: ActionCounts
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
  granularity: Granularity
): Promise<AnalyticsSnapshot> {
  const buckets = BUCKET_COUNT[granularity]

  const load = unstable_cache(
    async (): Promise<AnalyticsSnapshot> => {
      const supabase = createAdminClient()
      const args = {
        p_granularity: granularity,
        p_buckets: buckets,
        p_tz: REPORTING_TIMEZONE,
      }

      // One round trip each, issued together — they share a window but not a
      // shape, and unioning them in SQL would mean reconciling three different
      // row types for no saving.
      const [viewers, interest, actions] = await Promise.all([
        supabase.rpc('analytics_viewers_by_bucket', args),
        supabase.rpc('analytics_interest_breakdown', { ...args, p_limit: INTEREST_FETCH_LIMIT }),
        supabase.rpc('analytics_action_counts', args),
      ])

      for (const { error } of [viewers, interest, actions]) {
        if (error) {
          console.error('Analytics query failed:', error)
          throw new Error('Failed to load analytics')
        }
      }

      const viewerRows = (viewers.data ?? []) as ViewerBucket[]
      const interestRows = (interest.data ?? []) as InterestRow[]
      const actionRows = (actions.data ?? []) as ActionCountRow[]

      // Bucket labels are derived here, inside the cache, from the same instant
      // the SQL used. Deriving them at read time instead would silently break
      // the moment a cached payload outlived a bucket boundary: the axis would
      // advance, the rows would not, and every bar would render as zero.
      return {
        buckets: fillBuckets(viewerRows, granularity, buckets, new Date(), REPORTING_TIMEZONE),
        jobTypes: topInterests(interestRows, 'job_type', INTEREST_LIMIT),
        tags: topInterests(interestRows, 'tag', INTEREST_LIMIT),
        actions: normalizeActionCounts(actionRows),
        isEmpty: actionRows.length === 0,
      }
    },
    ['analytics', granularity],
    { tags: [ANALYTICS_TAG], revalidate: 300 }
  )

  return load()
}
