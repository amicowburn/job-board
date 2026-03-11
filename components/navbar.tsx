'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: 'https://monashmss.com/events', label: 'EVENTS' },
  { href: 'https://monashmss.com/committee', label: 'COMMITTEE' },
  { href: 'https://monashmss.com/publications', label: 'PUBLICATIONS' },
  { href: 'https://monashmss.com/join-us', label: 'JOIN THE MMSS' },
]

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-2.5 sm:p-[15px]">
      <nav className="max-w-[1200px] mx-auto">
        <div className="bg-white rounded-[15px] px-3 sm:px-[15px] flex items-center justify-between h-[50px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {/* Logo */}
          <Link
            href="https://monashmss.com"
            className="flex items-center shrink-0 px-[5px] h-[50px]"
          >
            <Image
              src="/mmss-logo.png"
              alt="MMSS"
              width={94}
              height={39}
              className="h-[32px] sm:h-[39px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center justify-end flex-1 gap-[5px]">
            {navItems.map((item) => {
              const isCurrentPage = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2 py-[5px] text-[16px] tracking-[-0.01em] uppercase transition-colors rounded-md hover:bg-slate-100 ${
                    isCurrentPage
                      ? 'text-slate-900 font-medium'
                      : 'text-slate-600'
                  }`}
                  style={{ fontFamily: 'var(--font-outfit)', fontWeight: 475 }}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-3 -mr-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-[21px] h-[16px] flex flex-col justify-between relative">
              <div className={`w-full h-[2px] bg-black rounded-full transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <div className={`w-full h-[2px] bg-black rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <div className={`w-full h-[2px] bg-black rounded-full transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden mt-2 bg-white rounded-[15px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="py-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 uppercase tracking-wide transition-colors"
                  style={{ fontFamily: 'var(--font-outfit)', fontWeight: 475 }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
