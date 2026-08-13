'use client'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/shadcn/chart'
import { InterestTable, formatCount, rowChartHeight, truncateLabel } from './interest-shared'
import { InsightBadge } from './insight-treatments'
import type { InterestSlice } from '@/lib/analytics/buckets'
import type { GrowthInsight } from '@/lib/analytics/growth'

export const description = 'A horizontal bar chart of interest by tag, labelled on the bars'

const chartConfig = {
  events: {
    label: 'Interactions',
    color: 'var(--chart-4)',
  },
  label: {
    // Ink, not paper. The shadcn recipe puts `--background` here because its
    // bars are dark; --chart-4 is a mid aqua that white text sits on at 2.8:1,
    // which is unreadable at 12px. Near-black on the same fill is 7.4:1.
    color: 'var(--foreground)',
  },
} satisfies ChartConfig

/**
 * Which tags visitors engage with.
 *
 * The tag name rides on its own bar instead of in a category axis beside it,
 * which returns the 112px gutter that axis reserved to the bars themselves —
 * on a half-width card that gutter was a fifth of the chart, and it forced
 * every label longer than 17 characters to be cut.
 *
 * Tags are free text on the job record, so the tail can be long: everything
 * past the top slice arrives folded into a single "Other" row from
 * `topInterests`, which keeps the bars summing to the real total instead of
 * quietly dropping the remainder.
 */
export function ChartBarTag({
  data,
  growth,
}: {
  data: InterestSlice[]
  growth: GrowthInsight
}) {
  if (data.length === 0) {
    return (
      <Card className="bg-white rounded-2xl border-slate-200 flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">Interest by tag</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center pb-6">
          <p className="text-sm text-muted-foreground">No tags recorded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white rounded-2xl border-slate-200 flex flex-col">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-base">Interest by tag</CardTitle>
        <InsightBadge insight={growth} />
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{ height: rowChartHeight(data.length) }}
        >
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            // The longest bar runs to the edge of the plot area, so the right
            // margin is what its count is drawn into. At the recipe's 16 the
            // largest number on the chart — always the one worth reading — is
            // the one that gets clipped.
            margin={{ left: 0, right: 44 }}
          >
            <CartesianGrid horizontal={false} />
            {/* Hidden, not removed: the axis still supplies the category scale
                and the tooltip's label, it just draws nothing. */}
            <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} hide />
            <XAxis dataKey="events" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="events" fill="var(--color-events)" radius={4} isAnimationActive={false}>
              <LabelList dataKey="label" content={<BarLabel data={data} />} />
            </Bar>
          </BarChart>
        </ChartContainer>

        <InterestTable data={data} dimensionLabel="Tag" />
      </CardContent>
    </Card>
  )
}

const LABEL_FONT_SIZE = 12
const VALUE_FONT_SIZE = 11

/** Rough advance width of Inter at 12px. Only ever used to decide placement. */
const CHAR_WIDTH = 6.4

/** Breathing room either side of a label sitting inside a bar. */
const INSET = 8

/**
 * The tag name and its count, drawn together.
 *
 * One renderer for both because their placement is coupled. A name only sits
 * inside its bar when the bar is long enough to hold it; a short bar pushes the
 * name outside, where a separately positioned count would land on top of it.
 * Drawing both here means the two can never collide.
 *
 * The fallback is the part that matters. The shadcn recipe assumes bars of
 * roughly even length, but these are a ranked distribution with a long tail —
 * on real data the bottom rows are a fraction of the top one, and a name placed
 * inside them would run off the end of the bar in bar-coloured text on a white
 * card, which is to say invisible.
 */
function BarLabel({
  data,
  x,
  y,
  width,
  height,
  value,
  index,
}: {
  data: InterestSlice[]
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: string | number
  index?: number
}) {
  const barX = Number(x) || 0
  const barY = Number(y) || 0
  const barWidth = Number(width) || 0
  const barHeight = Number(height) || 0

  const name = truncateLabel(String(value ?? ''))
  const count = formatCount(data[index ?? 0]?.events ?? 0)

  // Vertically centred on the bar; `dy` is the eyeballed baseline offset that
  // `dominant-baseline` would give if Safari applied it consistently to tspans.
  const centreY = barY + barHeight / 2
  const fitsInside = barWidth >= name.length * CHAR_WIDTH + INSET * 2

  if (fitsInside) {
    return (
      <>
        <text
          x={barX + INSET}
          y={centreY}
          dy={4}
          fill="var(--color-label)"
          fontSize={LABEL_FONT_SIZE}
          textAnchor="start"
        >
          {name}
        </text>
        <text
          x={barX + barWidth + INSET}
          y={centreY}
          dy={4}
          className="fill-muted-foreground"
          fontSize={VALUE_FONT_SIZE}
          textAnchor="start"
        >
          {count}
        </text>
      </>
    )
  }

  // Both outside, in one element so the gap between them is fixed rather than
  // computed from a bar length that is different on every row.
  return (
    <text x={barX + barWidth + INSET} y={centreY} dy={4} fontSize={LABEL_FONT_SIZE}>
      <tspan className="fill-foreground">{name}</tspan>
      <tspan dx={6} className="fill-muted-foreground" fontSize={VALUE_FONT_SIZE}>
        {count}
      </tspan>
    </text>
  )
}
