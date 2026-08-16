import { getAnalyticsSnapshot } from '@/lib/analytics/queries'
import { resolveRange } from '@/lib/analytics/constants'
import { RangeTabs } from '@/components/admin/analytics/range-tabs'
import { MetricCards } from '@/components/admin/analytics/metric-cards'
import { ChartViewersOverTime } from '@/components/admin/analytics/chart-viewers-over-time'
import { ChartBarJobType } from '@/components/admin/analytics/chart-bar-job-type'
import { ChartBarTag } from '@/components/admin/analytics/chart-bar-tag'

export const metadata = {
  title: 'User Analytics | Admin | MMSS Job Board',
}

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const { range } = await searchParams

  // Resolved against the known ranges rather than passed through: the value
  // reaches a Postgres function, and an unrecognised period has to become a
  // real one here rather than further down.
  const period = resolveRange(range)

  const { dailyBuckets, jobTypes, tags, actions, jobTypeGrowth, tagGrowth, isEmpty } =
    await getAnalyticsSnapshot(period.value)

  // "Last 3 months" reads as "last 3 months" mid-sentence, and as a tab label
  // in title case — one string, two positions.
  const periodLabel = period.label.toLowerCase()

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 font-heading">
            User Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Anonymous engagement across the job board — {periodLabel}, Melbourne time
          </p>
        </div>

        <RangeTabs current={period.value} />
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <MetricCards actions={actions} />

          <ChartViewersOverTime data={dailyBuckets} periodLabel={periodLabel} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <ChartBarJobType data={jobTypes} growth={jobTypeGrowth} />
            <ChartBarTag data={tags} growth={tagGrowth} />
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
      <h2 className="text-base font-semibold text-slate-800 font-heading">
        No activity recorded yet
      </h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Views, clicks, apply clicks and shares are tracked from the moment a visitor
        opens the job board. Numbers will appear here once the first visitor arrives —
        or try a wider time range above.
      </p>
    </div>
  )
}
