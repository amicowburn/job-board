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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/shadcn/chart'
import type { FilledBucket } from '@/lib/analytics/buckets'
import type { Granularity } from '@/lib/types'

export const description = 'An interactive area chart of viewers over time'

/** Keys match the data keys exactly — that is how shadcn resolves --color-* and tooltip labels. */
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

interface ChartViewersOverTimeProps {
  data: FilledBucket[]
  granularity: Granularity
  periodLabel: string
}

/**
 * Distinct viewers and total job views per time bucket.
 *
 * Both series share one axis: they are the same measure at different
 * resolutions (views ≥ viewers always), so a second y-axis would only distort
 * the comparison it exists to support.
 *
 * The two are NOT stacked, unlike shadcn's reference area chart. Views already
 * contains every viewer, so stacking would draw a combined height that means
 * nothing. Overlaying shows the gap between reach and repeat visits, which is
 * the actual story.
 *
 * Bucket labels come pre-computed from the server (`W32 2026`, `Aug 2026`,
 * `Q3 2026`, `2026`) rather than being formatted from a date here. A month
 * bucket rendered as "Aug 1" would read as a single day.
 */
export function ChartViewersOverTime({
  data,
  granularity,
  periodLabel,
}: ChartViewersOverTimeProps) {
  return (
    <Card className="overflow-hidden bg-white rounded-2xl border-slate-200">
      {/*
        No range control in this header, unlike shadcn's reference chart. The
        selected range drives the whole page — the counters and both interest
        charts as well — so a control sitting inside one card would imply it
        only governs that card. It lives in the page header instead.
      */}
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-base">Viewers over time</CardTitle>
          <CardDescription>
            Distinct visitors and total job views per {granularity}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
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
              minTickGap={16}
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
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>

        <p className="text-[11px] text-muted-foreground mt-2 px-2 sm:px-0">
          Distinct viewers are counted per period and do not sum across periods — the same
          visitor active in two periods is one viewer in each. Showing the last {periodLabel}.
        </p>

        <details className="mt-3 px-2 sm:px-0">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
            View as table
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-1.5 pr-4 font-medium">Period</th>
                  <th className="py-1.5 pr-4 font-medium text-right">Distinct viewers</th>
                  <th className="py-1.5 font-medium text-right">Job views</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
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
      </CardContent>
    </Card>
  )
}
