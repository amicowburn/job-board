import { ACTION_LABELS } from '@/lib/analytics/constants'
import type { ActionCounts, AnalyticsEventType } from '@/lib/types'

interface MetricCardsProps {
  actions: ActionCounts
  /** Distinct visitors across the whole window, from the viewers series. */
  totalViewers: number
  periodLabel: string
}

/**
 * The headline counters.
 *
 * Each tile carries a second line naming how many distinct jobs the action
 * touched, because "number of jobs clicked" is genuinely ambiguous between the
 * event count and the job count, and showing only one invites the wrong reading.
 */
const TRACKED: AnalyticsEventType[] = ['view', 'click', 'apply', 'share']

const DESCRIPTIONS: Record<AnalyticsEventType, string> = {
  view: 'Job detail panels opened',
  click: 'Listings opened from the board',
  apply: 'Visitors sent to the employer',
  apply_confirmed: 'Confirmed by the applicant on return',
  share: 'Listing links copied',
}

export function MetricCards({ actions, totalViewers, periodLabel }: MetricCardsProps) {
  const applyClicks = actions.apply.events
  const confirmed = actions.apply_confirmed.events

  // Share of people who left to apply and came back to say they finished.
  // Only meaningful once there is something to divide by.
  const confirmRate =
    applyClicks > 0 ? Math.round((confirmed / applyClicks) * 100) : null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <Tile
        label="Viewers"
        value={totalViewers}
        detail="Distinct visitors"
        description={`Unique people over the last ${periodLabel}`}
        emphasis
      />

      {TRACKED.map((action) => (
        <Tile
          key={action}
          label={ACTION_LABELS[action]}
          value={actions[action].events}
          detail={`${formatNumber(actions[action].distinct_jobs)} ${
            actions[action].distinct_jobs === 1 ? 'job' : 'jobs'
          }`}
          description={DESCRIPTIONS[action]}
        />
      ))}

      <Tile
        label={ACTION_LABELS.apply_confirmed}
        value={confirmed}
        detail={confirmRate === null ? 'No apply clicks yet' : `${confirmRate}% of apply clicks`}
        description="Confirmed on return — a floor, not a total. Applicants who never come back are never counted."
        emphasis
      />
    </div>
  )
}

function Tile({
  label,
  value,
  detail,
  description,
  emphasis = false,
}: {
  label: string
  value: number
  detail: string
  description: string
  emphasis?: boolean
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-4 ${
        emphasis ? 'border-primary/30' : 'border-slate-200'
      }`}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p
        className="text-[28px] leading-tight font-bold text-slate-800 mt-1"
        style={{ fontFamily: 'var(--font-outfit)' }}
      >
        {formatNumber(value)}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{detail}</p>
      <p className="text-[11px] text-slate-400 mt-2 leading-snug">{description}</p>
    </div>
  )
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-AU').format(value)
}
