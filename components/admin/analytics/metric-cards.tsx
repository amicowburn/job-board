import { ACTION_LABELS } from '@/lib/analytics/constants'
import type { ActionCounts, AnalyticsEventType } from '@/lib/types'

interface MetricCardsProps {
  actions: ActionCounts
}

/**
 * The headline counters.
 *
 * One surface divided into four cells rather than four separate cards. The
 * figures are short and the tiles were far wider than anything in them, so the
 * card gaps and the six edges of padding between them were buying separation
 * that a single hairline rule already provides. Value and qualifier share a
 * baseline for the same reason — stacking them spent vertical space to leave
 * the horizontal space emptier.
 *
 * Each cell is a label, a number and one qualifying line. The qualifier earns
 * its place by saying something the label cannot: how many distinct jobs an
 * action touched (because "jobs clicked" is ambiguous between the event count
 * and the job count), or what the confirmed-application figure is a share of.
 * The reporting window is stated once in the page header rather than repeated
 * on every cell here.
 *
 * Apply clicks is deliberately not tiled, but the figure is still read below to
 * express confirmed applications as a conversion rate — that ratio is what makes
 * the Applications number interpretable.
 */
const TRACKED: AnalyticsEventType[] = ['view', 'click', 'share']

export function MetricCards({ actions }: MetricCardsProps) {
  const applyClicks = actions.apply.events
  const confirmed = actions.apply_confirmed.events

  // Share of people who left to apply and came back to say they finished.
  // Only meaningful once there is something to divide by.
  const confirmRate = applyClicks > 0 ? Math.round((confirmed / applyClicks) * 100) : null

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1
                 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100"
    >
      {TRACKED.map((action) => (
        <Cell
          key={action}
          label={ACTION_LABELS[action]}
          value={actions[action].events}
          detail={`${formatNumber(actions[action].distinct_jobs)} ${
            actions[action].distinct_jobs === 1 ? 'job' : 'jobs'
          }`}
        />
      ))}

      <Cell
        label={ACTION_LABELS.apply_confirmed}
        value={confirmed}
        // Kept, unlike the other descriptions: that this figure is a floor and
        // not a total is the one thing a reader cannot infer from the label,
        // and getting it wrong overstates how many people actually applied.
        detail={
          confirmRate === null
            ? 'No apply clicks yet'
            : `${confirmRate}% of apply clicks · a floor, not a total`
        }
        emphasis
      />
    </div>
  )
}

function Cell({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string
  value: number
  detail: string
  emphasis?: boolean
}) {
  return (
    <div className="px-5 py-3.5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap mt-1.5">
        <p
          // Emphasis is carried by the brand colour rather than the outlined
          // card it replaces: inside a divided strip a coloured border would
          // read as a boundary between cells, not as weight on one figure.
          className={`text-[26px] leading-none font-bold font-heading ${
            emphasis ? 'text-primary' : 'text-slate-800'
          }`}
        >
          {formatNumber(value)}
        </p>
        <p className="text-[11px] text-slate-400 leading-snug">{detail}</p>
      </div>
    </div>
  )
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-AU').format(value)
}
