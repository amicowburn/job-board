import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/** Cache tags — revalidate these when the underlying rows change. */
export const SUBMISSIONS_TAG = 'submissions'

/**
 * Count of submissions awaiting review, shown as a badge in the admin nav on
 * every admin page.
 *
 * This is the one admin query worth caching across requests: it is identical
 * for every admin, it is re-run on every navigation, and it is a COUNT over a
 * growing table. It uses the service-role client deliberately — the cached
 * value must not depend on whose session ran it, since the cache is shared.
 *
 * Correctness comes from tag invalidation rather than a short TTL: anything
 * that changes the pending set calls `revalidateTag(SUBMISSIONS_TAG)`, so the
 * badge updates immediately. The TTL is only a backstop.
 */
export const getPendingSubmissionCount = unstable_cache(
  async () => {
    const { count } = await createAdminClient()
      .from('job_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return count ?? 0
  },
  ['pending-submission-count'],
  { tags: [SUBMISSIONS_TAG], revalidate: 300 }
)
