import { cn } from '@/lib/utils'

/**
 * Shared visual language for a segmented tab/pill group: a soft rounded-rect
 * track with an inset white "chip" behind the active item. Exposed as
 * className builders rather than a wrapper component, because the two call
 * sites need different elements around the same look — a `<nav>` of `<Link>`s
 * for the analytics range picker (the period is part of the URL) versus a
 * `<div>` of `<button>`s for the submissions status filter (client-side
 * toggle, no navigation) — and each keeps its own ARIA semantics.
 */
export const segmentedTabsListClassName = 'inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1'

export function segmentedTabsTriggerClassName(isActive: boolean, className?: string) {
  return cn(
    'shrink-0 rounded-lg px-3.5 py-1.5 text-sm transition-colors capitalize',
    isActive
      ? 'bg-white font-semibold text-slate-900 shadow-sm'
      : 'font-medium text-slate-500 hover:text-slate-800',
    className
  )
}
