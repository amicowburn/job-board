'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/feedback', label: 'Feedback' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm transition-colors',
            pathname.startsWith(item.href)
              ? 'text-background font-medium'
              : 'text-background/70 hover:text-background'
          )}
        >
          {item.label}
        </Link>
      ))}
      <Link
        href="/"
        className="text-sm text-background/70 hover:text-background"
        target="_blank"
      >
        View Site
      </Link>
    </nav>
  )
}
