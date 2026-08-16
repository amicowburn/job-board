'use client'

import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { GrowthInsight } from '@/lib/analytics/growth'
import type { InterestSlice } from '@/lib/analytics/buckets'

/**
 * Treatments for the per-chart insight.
 *
 * All three carry the same fact — how a category moved against the previous
 * window — and differ only in footprint. `InsightBadge` is what the charts use;
 * the other two are kept as drop-in alternatives.
 *
 * The insight sits directly under the card title, in the slot the descriptive
 * subtitle used to occupy: it is the one line of prose on the card that the
 * heading cannot already tell you, so it earns that position.
 */

/** Direction drives both the icon and the tone, so colour is never the only cue. */
function toneFor(direction: GrowthInsight['direction']) {
  switch (direction) {
    case 'up':
      return { chip: 'bg-emerald-50 text-emerald-700', Icon: TrendingUp }
    case 'down':
      return { chip: 'bg-rose-50 text-rose-700', Icon: TrendingDown }
    default:
      return { chip: 'bg-slate-100 text-slate-600', Icon: Minus }
  }
}

/** "+18%" / "−12%" / "—", using a real minus sign rather than a hyphen. */
function formatDelta(insight: GrowthInsight): string {
  if (insight.changePct === null) return '—'
  if (insight.changePct === 0) return '0%'
  return insight.changePct > 0 ? `+${insight.changePct}%` : `−${Math.abs(insight.changePct)}%`
}

/**
 * The delta as a pill, with the claim beside it.
 *
 * Reads as one line — "[↗ +18%] growth in graduate roles" — rather than the
 * stacked heading-and-caption block it replaces.
 */
export function InsightBadge({
  insight,
  className = '',
}: {
  insight: GrowthInsight
  className?: string
}) {
  const { chip, Icon } = toneFor(insight.direction)

  if (insight.direction === 'insufficient') {
    return <p className={`text-xs text-muted-foreground ${className}`}>{insight.sentence}</p>
  }

  // The pill already states the percentage, so strip it from the sentence
  // rather than printing the same number twice on one line.
  const withoutDelta = insight.sentence.replace(/^-?\d+%\s*/, '')

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${chip}`}
      >
        <Icon className="h-3 w-3" aria-hidden />
        {formatDelta(insight)}
      </span>
      <span className="text-xs text-muted-foreground">{withoutDelta}</span>
    </div>
  )
}

/**
 * The delta as a right-aligned KPI in the card header.
 *
 * Use when you want the number to carry more weight than the sentence. Drop
 * into a `CardHeader` laid out as `flex flex-row items-start justify-between`.
 */
export function InsightHeaderStat({ insight }: { insight: GrowthInsight }) {
  if (insight.direction === 'insufficient') return null

  const { Icon } = toneFor(insight.direction)
  const tone =
    insight.direction === 'up'
      ? 'text-emerald-600'
      : insight.direction === 'down'
        ? 'text-rose-600'
        : 'text-slate-500'

  return (
    <div className="text-right shrink-0">
      <div className="flex items-center justify-end gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${tone}`} aria-hidden />
        <span className="text-lg font-semibold text-slate-800 leading-none font-heading">
          {formatDelta(insight)}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1 leading-none">
        {insight.label ?? ''}
      </p>
    </div>
  )
}

/**
 * The delta paired with a sparkline of the category distribution.
 *
 * The spark is the drop-off curve across categories, not a time series — it
 * answers "is one category running away with it, or is this a flat field?",
 * which the movement figure alone cannot. Worth the extra height only when
 * there are enough categories for the shape to say something.
 */
export function InsightSparkline({
  insight,
  data,
}: {
  insight: GrowthInsight
  data: InterestSlice[]
}) {
  if (insight.direction === 'insufficient') {
    return <p className="text-xs text-muted-foreground">{insight.sentence}</p>
  }

  const { Icon } = toneFor(insight.direction)

  return (
    <div className="flex items-center gap-3">
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold text-slate-800 leading-none font-heading">
            {formatDelta(insight)}
          </span>
          <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 leading-none whitespace-nowrap">
          {insight.label ?? ''}
        </p>
      </div>

      <Sparkline values={data.map((d) => d.events)} />
    </div>
  )
}

/** Minimal inline area spark. No axes, no ticks — shape only. */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null

  const width = 88
  const height = 28
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / span) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      role="img"
      aria-label={`Distribution across ${values.length} categories, highest ${max}, lowest ${min}`}
    >
      <polyline
        points={`0,${height} ${points.join(' ')} ${width},${height}`}
        fill="var(--chart-1)"
        fillOpacity={0.12}
        stroke="none"
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
