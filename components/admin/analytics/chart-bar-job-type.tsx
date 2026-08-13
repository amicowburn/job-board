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
import {
  COLUMN_CHART_HEIGHT,
  InterestTable,
  formatCount,
  truncateLabel,
} from './interest-shared'
import { InsightBadge } from './insight-treatments'
import type { InterestSlice } from '@/lib/analytics/buckets'
import type { GrowthInsight } from '@/lib/analytics/growth'

export const description = 'A bar chart of interest by job type'

const chartConfig = {
  events: {
    label: 'Interactions',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

/**
 * Which job categories visitors engage with.
 *
 * Columns rather than rows, unlike the tag chart beside it. `job_type` is a
 * closed enum of six values with short, one-word names, so they fit as axis
 * ticks — and once the category axis is horizontal the 112px gutter the rows
 * version reserved on the left disappears, along with the truncation it forced
 * on every label. The chart is also half the height it was: six columns need
 * 200px, where six rows plus their padding needed nearly 300.
 *
 * Every event type counts, not just views: an apply click is a stronger
 * interest signal than a view, and excluding it would understate the categories
 * people actually act on.
 */
export function ChartBarJobType({
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
          <CardTitle className="text-base">Interest by job type</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center pb-6">
          <p className="text-sm text-muted-foreground">No job types recorded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white rounded-2xl border-slate-200 flex flex-col">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-base">Interest by job type</CardTitle>
        <InsightBadge insight={growth} />
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{ height: COLUMN_CHART_HEIGHT }}
        >
          {/* Top margin is for the value labels, which sit above the columns
              and would otherwise be clipped by the plot area. */}
          <BarChart accessibilityLayer data={data} margin={{ top: 18 }}>
            <CartesianGrid vertical={false} />
            {/* Hidden, but declared: Recharts' default domain rounds the top up
                to a "nice" number, which on 420 means a 500-high plot and a
                sixth of the card given over to blank space above the tallest
                column. There are no tick labels to make round numbers legible,
                so nothing is lost by ending the scale at the data. */}
            <YAxis dataKey="events" type="number" domain={[0, 'dataMax']} hide />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              // Recharts drops ticks that would collide, which on a category
              // axis means silently unlabelled columns. With six of them there
              // is room for all six, so every column is labelled explicitly.
              interval={0}
              fontSize={11}
              tickFormatter={(value: string) => truncateLabel(value, 12)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="events" fill="var(--color-events)" radius={6} isAnimationActive={false}>
              {/* Direct labels are the relief that keeps these bars readable
                  regardless of the fill's contrast against the card. */}
              <LabelList
                dataKey="events"
                position="top"
                offset={8}
                className="fill-muted-foreground"
                fontSize={11}
                formatter={formatCount}
              />
            </Bar>
          </BarChart>
        </ChartContainer>

        <InterestTable data={data} dimensionLabel="Job type" />
      </CardContent>
    </Card>
  )
}
