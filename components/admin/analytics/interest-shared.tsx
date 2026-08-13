import type { InterestSlice } from '@/lib/analytics/buckets'

/**
 * Pieces shared by the two interest charts.
 *
 * They render the same measure on two different dimensions, so the number
 * formatting and the table view are identical by definition. Keeping them in
 * one place stops the pair drifting apart.
 *
 * The charts no longer share a shape: job type reads as columns and tag as
 * rows, because a closed six-value enum and a long free-text tail want
 * different layouts. The category-axis tick and its 112px gutter that used to
 * live here went with that change — neither chart reserves an axis for labels
 * any more.
 */

/**
 * Height of the job-type columns.
 *
 * Fixed rather than derived from the category count: the enum has six values,
 * so the column count barely moves, and a fixed height lets the card sit level
 * with the tag chart beside it.
 */
export const COLUMN_CHART_HEIGHT = 200

/**
 * Height of the tag rows.
 *
 * Tighter per row than the version with a category axis — the label now sits on
 * the bar rather than beside it, so the row only has to be tall enough for the
 * bar itself.
 */
export function rowChartHeight(rowCount: number): number {
  return Math.max(160, rowCount * 30 + 16)
}

/**
 * Takes `unknown` rather than `number | string`: Recharts' LabelFormatter is
 * typed against RenderableText, which admits undefined, so a narrower parameter
 * is not assignable to it.
 */
export const formatCount = (value: unknown): string =>
  new Intl.NumberFormat('en-AU').format(Number(value) || 0)

/** Longest category label drawn on a chart before it is cut. */
export const MAX_LABEL_CHARS = 17

/** Truncation for chart labels. The full text stays in the tooltip and the table. */
export function truncateLabel(label: string, max: number = MAX_LABEL_CHARS): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
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
