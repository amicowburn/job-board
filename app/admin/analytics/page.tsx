import { getAnalyticsSnapshot } from '@/lib/analytics/queries'
import { BUCKET_COUNT, GRANULARITIES } from '@/lib/analytics/constants'
import { GranularitySelect } from '@/components/admin/analytics/granularity-select'
import { MetricCards } from '@/components/admin/analytics/metric-cards'
import { ChartViewersOverTime } from '@/components/admin/analytics/chart-viewers-over-time'
import { ChartBarJobType } from '@/components/admin/analytics/chart-bar-job-type'
import { ChartBarTag } from '@/components/admin/analytics/chart-bar-tag'
import type { Granularity } from '@/lib/types'

export const metadata = {
  title: 'User Analytics | Admin | MMSS Job Board',
}

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

const PERIOD_NOUN: Record<Granularity, string> = {
  week: 'weeks',
  month: 'months',
  quarter: 'quarters',
  year: 'years',
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const { range } = await searchParams

  // Validated against the whitelist rather than passed through: the value
  // reaches a Postgres function, and `date_trunc` will happily take strings
  // this dashboard has no charts for.
  const granularity: Granularity = GRANULARITIES.includes(range as Granularity)
    ? (range as Granularity)
    : 'month'

  const { buckets, jobTypes, tags, actions, isEmpty } = await getAnalyticsSnapshot(granularity)

  const periodLabel = `${BUCKET_COUNT[granularity]} ${PERIOD_NOUN[granularity]}`

  // Distinct visitors across the whole window, counted by Postgres over the
  // whole window rather than derived from the chart. Summing the per-bucket
  // bars would count a returning student once per period they showed up in,
  // and taking their max would undercount everyone who visited only once.
  const totalViewers = actions.view.visitors

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[22px] font-bold text-slate-800"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            User Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Anonymous engagement across the job board — last {periodLabel}, Melbourne time
          </p>
        </div>

        <GranularitySelect current={granularity} />
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <MetricCards actions={actions} totalViewers={totalViewers} periodLabel={periodLabel} />

          <ChartViewersOverTime
            data={buckets}
            granularity={granularity}
            periodLabel={periodLabel}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartBarJobType data={jobTypes} periodLabel={periodLabel} />
            <ChartBarTag data={tags} periodLabel={periodLabel} />
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
      <h2
        className="text-base font-semibold text-slate-800"
        style={{ fontFamily: 'var(--font-outfit)' }}
      >
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
