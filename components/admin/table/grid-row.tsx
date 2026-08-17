import { cn } from '@/lib/utils'

interface GridRowProps {
  /**
   * The grid's column template as a literal Tailwind arbitrary-value class,
   * e.g. `grid-cols-[22px_minmax(0,1fr)_96px_84px_76px]` — written out at
   * the call site (not built from a dynamic string) so Tailwind's JIT scanner
   * can actually see it; a class assembled at runtime from a prop value
   * never gets generated. Each table defines its own template and passes it
   * through unchanged.
   */
  columnsClassName: string
  header?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Row chrome (background/border/hover) shared by the jobs and submissions
 * grids, with the actual column widths left to each caller. `pr-5` lives on
 * the inner grid, not the outer row: background/border/hover need the row's
 * true full width, and only the grid content is inset for right-edge
 * breathing room — padding the outer div directly leaves a blank sliver
 * short of the row's actual right edge instead.
 */
export function GridRow({ columnsClassName, header = false, className, children }: GridRowProps) {
  return (
    <div
      role="row"
      className={cn(
        header
          ? 'bg-slate-50 border-b border-slate-100'
          : 'border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60 transition-colors',
        className
      )}
    >
      <div className={cn('grid pr-5', columnsClassName)}>{children}</div>
    </div>
  )
}
