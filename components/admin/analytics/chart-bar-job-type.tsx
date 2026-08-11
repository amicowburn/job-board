'use client'

import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'

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
  CategoryTick,
  INTEREST_AXIS_WIDTH,
  InterestTable,
  formatCount,
  interestChartHeight,
} from './interest-shared'
import { InsightBadge } from './insight-treatments'
import type { InterestSlice } from '@/lib/analytics/buckets'
import type { GrowthInsight } from '@/lib/analytics/growth'

export const description = 'A horizontal bar chart of interest by job type'

const chartConfig = {
  events: {
    label: 'Interactions',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

/**
 * Which job categories visitors engage with.
 *
 * Horizontal bars rather than a pie: these categories routinely land within a
 * few percent of each other, and near-equal slice angles are very hard to rank
 * by eye where bar lengths are trivially comparable. Bars also leave room for
 * the value on every row instead of pushing it into a legend.
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
          style={{ height: interestChartHeight(data.length) }}
        >
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 48 }}
          >
            <XAxis type="number" dataKey="events" hide />
            <YAxis
              dataKey="label"
              type="category"
              tick={<CategoryTick />}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={INTEREST_AXIS_WIDTH}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="events" fill="var(--color-events)" radius={5} isAnimationActive={false}>
              {/* Direct labels are the relief that keeps these bars readable
                  regardless of the fill's contrast against the card. */}
              <LabelList
                dataKey="events"
                position="right"
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
