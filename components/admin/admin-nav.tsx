'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AdminNavProps {
  pendingSubmissions?: number
}

export function AdminNav({ pendingSubmissions = 0 }: AdminNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin/jobs', label: 'Jobs', badge: 0 },
    { href: '/admin/submissions', label: 'Submissions', badge: pendingSubmissions },
    { href: '/admin/feedback', label: 'Feedback', badge: 0 },
    { href: '/admin/users', label: 'Admins', badge: 0 },
  ]

  return (
    <nav className="flex items-center gap-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm transition-colors inline-flex items-center gap-1.5',
            pathname.startsWith(item.href)
              ? 'text-background font-medium'
              : 'text-background/70 hover:text-background'
          )}
        >
          {item.label}
          {item.badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white leading-none">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
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
