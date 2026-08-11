'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import { useIsMobile } from '@/hooks/use-mobile'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs'
import type { FilledBucket } from '@/lib/analytics/buckets'

export const description = 'An interactive area chart of total visitors'

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

type TimeRange = '90d' | '30d' | '7d'

const RANGE_OPTIONS: { value: TimeRange; label: string; days: number }[] = [
  { value: '90d', label: 'Last 3 months', days: 90 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '7d', label: 'Last 7 days', days: 7 },
]

/**
 * Total visitors over time, with its own range control.
 *
 * The card owns its range rather than following the page-level picker: the tabs
 * sit in this header and change nothing else on the page. All 90 days arrive
 * from the server in one go and the shorter ranges are a slice of that array,
 * so switching is instant and costs no round trip.
 *
 * The two series are overlaid, not stacked. Job views already contains every
 * distinct viewer, so a stacked height would be a number that means nothing;
 * overlaying shows the gap between reach and repeat visits.
 */
export function ChartViewersOverTime({ data }: { data: FilledBucket[] }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<TimeRange>('90d')

  React.useEffect(() => {
    if (isMobile) setTimeRange('7d')
  }, [isMobile])

  const active = RANGE_OPTIONS.find((option) => option.value === timeRange) ?? RANGE_OPTIONS[0]

  return (
    <Card className="bg-white rounded-2xl border-slate-200">
      {/*
        Tabs wraps the whole card, not just the control. Radix points each
        trigger's aria-controls at its panel, so a TabsList without a matching
        TabsContent leaves those references dangling — the chart lives inside
        the panels for that reason, and only the active one is mounted.
      */}
      <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
        <CardHeader className="flex flex-col gap-2 space-y-0 border-b py-5 sm:flex-row sm:items-center">
          <div className="grid flex-1 gap-1">
            <CardTitle className="text-base">Total Visitors</CardTitle>
            {/* Tracks the active tab — the reference leaves this line static,
                which reads as a bug the moment you switch range. */}
            <CardDescription>Total for the {active.label.toLowerCase()}</CardDescription>
          </div>

          {/* Tabs on desktop; the same choices collapse into a select on narrow
              screens, where three side-by-side triggers wrap. */}
          <TabsList className="hidden sm:inline-flex">
            {RANGE_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value} className="px-4">
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger
              className="flex w-40 sm:hidden rounded-lg"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-lg">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {RANGE_OPTIONS.map((option) => (
            <TabsContent key={option.value} value={option.value} className="mt-0">
              {/* The server sends buckets oldest-first, so the most recent N
                  days are the tail. Slicing beats filtering by date: the bucket
                  boundaries were already resolved in Melbourne time server-side,
                  and re-deriving them on the client risks disagreeing. */}
              <RangePanel
                buckets={data.slice(Math.max(0, data.length - option.days))}
              />
            </TabsContent>
          ))}
        </CardContent>
      </Tabs>
    </Card>
  )
}

function RangePanel({ buckets }: { buckets: FilledBucket[] }) {
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
