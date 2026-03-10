import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-muted text-foreground',
      success: 'bg-success/10 text-success border-success/20',
      warning: 'bg-accent/10 text-accent border-accent/20',
      destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Alert.displayName = 'Alert'

const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
)

AlertTitle.displayName = 'AlertTitle'

const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
)

AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
