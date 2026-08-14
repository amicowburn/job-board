'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AdminNavProps {
  pendingSubmissions?: number
}

export function AdminNav({ pendingSubmissions = 0 }: AdminNavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/submissions', label: 'Submissions', badge: pendingSubmissions },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/users', label: 'Admins' },
  ]

  return (
    <>
      {/* Desktop nav — unchanged, just now explicitly desktop-only */}
      <nav className="hidden md:flex items-center gap-1">
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

      {/* Mobile toggle — same 3-bar icon/animation as components/navbar.tsx,
          mirrored rather than reinvented. */}
      <button
        className="md:hidden p-2 -ml-1"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle menu"
      >
        <div className="w-[21px] h-[16px] flex flex-col justify-between relative">
          <div className={`w-full h-[2px] bg-black rounded-full transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <div className={`w-full h-[2px] bg-black rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <div className={`w-full h-[2px] bg-black rounded-full transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </div>
      </button>

      {/* Mobile dropdown — fixed rather than a DOM-flow sibling like navbar.tsx
          uses, because AdminNav is nested inside the h-[50px] pill, not a
          top-level header child; a flow-based panel would clip against that
          fixed height. top-[65px] = the header's own py-[15px] + h-[50px];
          left/right-[4vw] matches the header's own gutter. */}
      {menuOpen && (
        <div className="md:hidden fixed top-[65px] left-[4vw] right-[4vw] z-50 bg-white rounded-[15px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{ fontFamily: 'var(--font-outfit)' }}
                className="flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {item.label}
                {item.badge != null && item.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground leading-none">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
            <Link
              href="/"
              target="_blank"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'var(--font-outfit)' }}
              className="block px-5 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              View Site ↗
            </Link>
            {/* Sign out isn't part of AdminNav's data today — it's a separate
                form in app/admin/layout.tsx's right-side block, hidden below
                md now that it lives here instead. Same action/method. */}
            <form action="/api/auth/signout" method="POST" className="border-t border-slate-100 mt-1 pt-1">
              <button
                type="submit"
                className="block w-full text-left px-5 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
