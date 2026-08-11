import type { InterestSlice } from '@/lib/analytics/buckets'

/**
 * Pieces shared by the two interest charts.
 *
 * They render the same measure on two different dimensions, so the row height,
 * the table view and the footer summary are identical by definition. Keeping
 * them in one place stops the pair drifting apart.
 */

/** Enough room per row to keep bars thin, with a floor so a two-row chart isn't a sliver. */
export function interestChartHeight(rowCount: number): number {
  return Math.max(180, rowCount * 34 + 24)
}

/** Width reserved for the category axis. */
export const INTEREST_AXIS_WIDTH = 112

/** Longest label that fits that width on one line at 11px. */
const MAX_LABEL_CHARS = 17

export const formatCount = (value: number | string) =>
  new Intl.NumberFormat('en-AU').format(Number(value) || 0)

/**
 * Single-line category tick.
 *
 * Recharts' default tick word-wraps anything wider than the axis, which turns a
 * free-form tag like "Brand campaign" into two stacked lines that collide with
 * its neighbours at these row heights. Truncating on one line keeps the rows
 * readable; the full label stays in the tooltip and the table.
 */
export function CategoryTick({
  x,
  y,
  payload,
}: {
  x?: number
  y?: number
  payload?: { value?: string | number }
}) {
  const label = String(payload?.value ?? '')
  const shown =
    label.length > MAX_LABEL_CHARS ? `${label.slice(0, MAX_LABEL_CHARS - 1)}…` : label

  return (
    <text x={x} y={y} dy={4} textAnchor="end" className="fill-muted-foreground" fontSize={11}>
      <title>{label}</title>
      {shown}
    </text>
  )
}

export function InterestTable({
  data,
  dimensionLabel,
}: {
  data: InterestSlice[]
  dimensionLabel: string
}) {
  return (
    <details className="mt-2">
      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
        View as table
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-1.5 pr-4 font-medium">{dimensionLabel}</th>
              <th className="py-1.5 pr-4 font-medium text-right">Interactions</th>
              <th className="py-1.5 font-medium text-right">Visitors</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.label} className="border-b border-border/50 last:border-0">
                <td className="py-1.5 pr-4">{row.label}</td>
                <td className="py-1.5 pr-4 text-right tabular-nums">{row.events}</td>
                <td className="py-1.5 text-right tabular-nums">{row.visitors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
