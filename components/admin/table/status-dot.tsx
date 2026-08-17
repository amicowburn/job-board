import { cn } from '@/lib/utils'

/**
 * Semantic role, not a literal color — callers map their own domain status
 * (job is_active, submission pending/approved/rejected, ...) onto one of
 * these. `muted` is deliberately separate from `destructive`: a job being
 * Inactive is a normal, reversible state, not a failure, and shouldn't read
 * as one.
 */
export type StatusDotRole = 'success' | 'warning' | 'destructive' | 'muted'

const ROLE_STYLES: Record<StatusDotRole, { dot: string; text: string }> = {
  success: { dot: 'bg-success', text: 'text-success' },
  warning: { dot: 'bg-warning', text: 'text-warning' },
  destructive: { dot: 'bg-destructive', text: 'text-destructive' },
  muted: { dot: 'bg-muted-foreground/50', text: 'text-muted-foreground' },
}

/**
 * Dot + label, no wrapping element — drops straight into whatever flex
 * container the caller already has (grid cell, card row, ...) rather than
 * adding a nesting layer around it.
 */
export function StatusDot({ role, label }: { role: StatusDotRole; label: string }) {
  const style = ROLE_STYLES[role]

  return (
    <>
      <span className={cn('size-1.5 rounded-full shrink-0', style.dot)} aria-hidden="true" />
      <span className={cn('text-xs font-medium capitalize', style.text)}>{label}</span>
    </>
  )
}
