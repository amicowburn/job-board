'use client'

import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  leadSummary,
} from './interest-shared'
import type { InterestSlice } from '@/lib/analytics/buckets'

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
 * Horizontal because the labels are words of varying length — "part-time",
 * "internship" — and rotated x-axis labels are the standard way to make a
 * category chart unreadable.
 *
 * Every event type counts, not just views: an apply click is a stronger
 * interest signal than a view, and excluding it would understate the categories
 * people actually act on.
 */
export function ChartBarJobType({
  data,
  periodLabel,
}: {
  data: InterestSlice[]
  periodLabel: string
}) {
  if (data.length === 0) {
    return (
      <Card className="bg-white rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Interest by job type</CardTitle>
          <CardDescription>Every tracked interaction, weighted equally</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No job types recorded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white rounded-2xl border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Interest by job type</CardTitle>
        <CardDescription>Every tracked interaction, weighted equally</CardDescription>
      </CardHeader>
      <CardContent>
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
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {leadSummary(data)} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing interest across job types for the last {periodLabel}
        </div>
      </CardFooter>
    </Card>
  )
}
