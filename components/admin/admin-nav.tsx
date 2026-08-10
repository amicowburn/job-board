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
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/submissions', label: 'Submissions', badge: pendingSubmissions },
    { href: '/admin/feedback', label: 'Feedback' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/users', label: 'Admins' },
  ]

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{ fontFamily: 'var(--font-outfit)' }}
          className={cn(
            'px-3 py-[5px] rounded-full text-sm font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap',
            pathname.startsWith(item.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          {item.label}
          {item.badge != null && item.badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-white text-primary leading-none">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </Link>
      ))}
      <Link
        href="/"
        target="_blank"
        style={{ fontFamily: 'var(--font-outfit)' }}
        className="px-3 py-[5px] rounded-full text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap ml-1"
      >
        View Site ↗
      </Link>
    </nav>
  )
}
