'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * pt-20 exists only to clear the fixed public Navbar. Navbar hides itself on
 * /admin/* routes (they render their own sticky header instead), so this
 * padding has to follow that same split rather than applying unconditionally
 * — otherwise admin pages get 80px of dead space above their own header.
 */
export function SiteMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  return (
    <main className={cn('min-h-screen', !isAdmin && 'pt-20')}>
      {children}
    </main>
  )
}
