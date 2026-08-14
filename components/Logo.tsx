import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * width/height per variant are each file's real intrinsic pixel size, not a
 * guessed ratio — Next/Image only uses them to reserve layout space, and a
 * mismatch between these props and the rendered size (via className) is
 * what triggers its "width or height modified, but not the other" console
 * warning. `admin` isn't a re-crop of the same mark — it's a separate
 * lockup (public/mmss-logo-admin.png) with the same internal padding
 * proportions as `default`'s artwork, so the two render at matching visual
 * weight at the same CSS height without either needing its own override.
 */
const LOGO_VARIANTS = {
  default: { src: '/mmss-logo.png', width: 1921, height: 882 },
  admin: { src: '/mmss-logo-admin.png', width: 311, height: 80 },
} satisfies Record<string, { src: string; width: number; height: number }>

interface LogoProps {
  variant?: keyof typeof LOGO_VARIANTS
  className?: string
  /** Above-the-fold usages (the public nav) want this as an LCP hint. */
  priority?: boolean
}

export function Logo({ variant = 'default', className, priority }: LogoProps) {
  const { src, width, height } = LOGO_VARIANTS[variant]

  return (
    <Image
      src={src}
      alt="MMSS"
      width={width}
      height={height}
      priority={priority}
      // No inline height override here — an inline style beats any `h-*`
      // class a caller passes (higher specificity), which previously forced
      // every usage to `height:auto` regardless of its className and made
      // the image render at its raw intrinsic size. `w-auto` in the default
      // className below is what actually satisfies Next/Image's aspect-
      // ratio check; callers just need to keep pairing it with an `h-*`.
      className={cn('h-8 w-auto object-contain', className)}
    />
  )
}
