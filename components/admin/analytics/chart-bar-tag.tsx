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

export const description = 'A horizontal bar chart of interest by tag'

const chartConfig = {
  events: {
    label: 'Interactions',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

/**
 * Which tags visitors engage with.
 *
 * Tags are free text on the job record, so the tail can be long — everything
 * past the top slice arrives folded into a single "Other" row from
 * `topInterests`, which keeps the bars summing to the real total instead of
 * quietly dropping the remainder.
 */
export function ChartBarTag({
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
          <CardTitle className="text-base">Interest by tag</CardTitle>
          <CardDescription>Top tags across all tracked interactions</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No tags recorded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white rounded-2xl border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Interest by tag</CardTitle>
        <CardDescription>Top tags across all tracked interactions</CardDescription>
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

        <InterestTable data={data} dimensionLabel="Tag" />
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {leadSummary(data)} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing interest across tags for the last {periodLabel}
        </div>
      </CardFooter>
    </Card>
  )
}
