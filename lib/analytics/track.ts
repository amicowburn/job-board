import type { AnalyticsEventType } from '@/lib/types'

/**
 * Client-side engagement tracking.
 *
 * Fire-and-forget by design: nothing here returns a promise callers can await,
 * and nothing throws. A broken analytics endpoint must not break the job board.
 */

const ENDPOINT = '/api/track'

/**
 * Events already sent this page load, keyed `type:jobId`.
 *
 * Without this, `view` would fire on every re-render of the detail panel and a
 * single visitor idling on one job would look like dozens of views. Scoped to
 * the module, so a full navigation legitimately resets it.
 */
const sent = new Set<string>()

export function trackEvent(type: AnalyticsEventType, jobId: string | null | undefined): void {
  if (typeof window === 'undefined' || !jobId) return

  const key = `${type}:${jobId}`
  if (sent.has(key)) return
  sent.add(key)

  const payload = JSON.stringify({ event_type: type, job_id: jobId })

  try {
    // sendBeacon matters most for `apply`, which fires as the browser is
    // already navigating to the employer's site — a normal fetch would be
    // cancelled mid-flight and the click would go uncounted.
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([payload], { type: 'application/json' }))) {
      return
    }

    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Swallowed: see the module comment.
    })
  } catch {
    // Swallowed: see the module comment.
  }
}

/** Escape hatch for tests, which need a clean dedupe set between cases. */
export function __resetTrackedEvents(): void {
  sent.clear()
}
