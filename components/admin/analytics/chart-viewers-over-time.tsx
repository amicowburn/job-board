'use client'

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/shadcn/chart'
import type { FilledBucket } from '@/lib/analytics/buckets'

export const description = 'An area chart of total visitors over the reporting period'

/**
 * Unchanged: MMSS purple for distinct viewers, orange for job views. The
 * reference design is monochrome on a dark surface; only its structure and
 * interaction are adopted here, not its palette.
 */
const chartConfig = {
  viewers: {
    label: 'Distinct viewers',
    color: 'var(--chart-1)',
  },
  views: {
    label: 'Job views',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

/**
 * Total visitors over time, for whatever period the page is showing.
 *
 * The card used to carry its own range tabs — a second time control that moved
 * this chart and nothing else, so the series could be showing a week while the
 * counters above it reported a quarter. The page-level control is now the only
 * one, and the server sends exactly the days it asked for: no client-side
 * slicing, no local range state, and one period stated once in the header.
 *
 * The two series are overlaid, not stacked. Job views already contains every
 * distinct viewer, so a stacked height would be a number that means nothing;
 * overlaying shows the gap between reach and repeat visits.
 */
export function ChartViewersOverTime({
  data,
  periodLabel,
}: {
  data: FilledBucket[]
  /** Already lower-cased by the page, which owns the wording. */
  periodLabel: string
}) {
  return (
    <Card className="bg-white rounded-2xl border-slate-200">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base">Total Visitors</CardTitle>
        <CardDescription>Total for the {periodLabel}</CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <VisitorsPanel buckets={data} />
      </CardContent>
    </Card>
  )
}

function VisitorsPanel({ buckets }: { buckets: FilledBucket[] }) {
  return (
    <>
      <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
        <AreaChart data={buckets}>
          <defs>
            <linearGradient id="fillViewers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-viewers)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-viewers)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Area
            dataKey="views"
            isAnimationActive={false}
            type="natural"
            fill="url(#fillViews)"
            stroke="var(--color-views)"
          />
          <Area
            dataKey="viewers"
            isAnimationActive={false}
            type="natural"
            fill="url(#fillViewers)"
            stroke="var(--color-viewers)"
          />
        </AreaChart>
      </ChartContainer>

      <p className="text-[11px] text-muted-foreground mt-2 px-2 sm:px-0">
        Viewers are counted per day and do not sum across days.
      </p>

      <details className="mt-3 px-2 sm:px-0">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
          View as table
        </summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-1.5 pr-4 font-medium">Day</th>
                <th className="py-1.5 pr-4 font-medium text-right">Distinct viewers</th>
                <th className="py-1.5 font-medium text-right">Job views</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((row) => (
                <tr key={row.bucketStart} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 pr-4">{row.label}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{row.viewers}</td>
                  <td className="py-1.5 text-right tabular-nums">{row.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}
