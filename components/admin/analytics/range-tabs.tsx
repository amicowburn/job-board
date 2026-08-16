import Link from 'next/link'

import { RANGES } from '@/lib/analytics/constants'
import type { AnalyticsRange } from '@/lib/analytics/constants'
import { segmentedTabsListClassName, segmentedTabsTriggerClassName } from '@/components/ui/segmented-tabs'

/**
 * The page's only time-period control.
 *
 * Links rather than a client-side toggle, because the range decides what the
 * server aggregates — every figure on the page is cut from it, not just the
 * chart it sits above. That makes the period part of the address: a particular
 * view is linkable, the back button steps through periods, and the snapshot for
 * each range stays cached for five minutes, so switching back is instant.
 *
 * Being links also means no client component and no pending state to manage —
 * Next owns the navigation.
 */
export function RangeTabs({ current }: { current: AnalyticsRange }) {
  return (
    <nav aria-label="Reporting period" className={segmentedTabsListClassName}>
      {RANGES.map((range) => {
        const isActive = range.value === current

        return (
          <Link
            key={range.value}
            href={`/admin/analytics?range=${range.value}`}
            scroll={false}
            // `aria-current` rather than styling alone: the active period is
            // the page's whole context, and a screen reader gets no help from
            // a white background.
            aria-current={isActive ? 'page' : undefined}
            className={segmentedTabsTriggerClassName(isActive, 'normal-case')}
          >
            {range.label}
          </Link>
        )
      })}
    </nav>
  )
}
