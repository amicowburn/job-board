'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select'
import { GRANULARITIES } from '@/lib/analytics/constants'
import type { Granularity } from '@/lib/types'

const LABELS: Record<Granularity, string> = {
  // Present only to keep the map total; GRANULARITIES omits 'day', so this
  // option is never rendered.
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
  quarter: 'Quarterly',
  year: 'Yearly',
}

/**
 * Time-granularity control.
 *
 * shadcn's reference chart keeps the selected range in local state, which would
 * be wrong here: the range decides what the server fetches and aggregates, so
 * it has to reach the server component. Selecting pushes `?range=` instead —
 * matching the `?view=` and `?page=` params elsewhere in the admin area, and
 * keeping a particular view linkable.
 *
 * The transition keeps the trigger responsive while the server re-renders,
 * rather than leaving the select looking stuck on the old value.
 */
export function GranularitySelect({ current }: { current: Granularity }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        startTransition(() => {
          router.push(`/admin/analytics?range=${value}`, { scroll: false })
        })
      }}
    >
      <SelectTrigger
        className="w-[160px] rounded-lg sm:ml-auto"
        aria-label="Select a time granularity"
        data-pending={isPending || undefined}
        disabled={isPending}
      >
        <SelectValue placeholder="Monthly" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {GRANULARITIES.map((granularity) => (
          <SelectItem key={granularity} value={granularity} className="rounded-lg">
            {LABELS[granularity]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
