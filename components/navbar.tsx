'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: 'https://monashmmss.com/events', label: 'EVENTS' },
  { href: 'https://monashmmss.com/committee', label: 'COMMITTEE' },
  { href: 'https://monashmmss.com/recruitment', label: 'RECRUITMENT' },
  { href: '/', label: 'JOB BOARD', isActive: true },
  { href: 'https://monashmmss.com/join-us', label: 'JOIN THE MMSS' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-[15px] bg-white">
      <nav className="max-w-[1200px] mx-auto">
        <div className="bg-white backdrop-blur-[10px] rounded-[15px] px-[15px] flex items-center justify-between h-[50px] border border-slate-200">
          {/* Logo */}
          <Link
            href="https://monashmmss.com"
            className="flex items-center shrink-0 px-[5px] h-[50px]"
          >
            <Image
              src="/mmss-logo.png"
              alt="MMSS"
              width={94}
              height={39}
              className="h-[39px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center justify-end flex-1 gap-[5px]">
            {navItems.map((item) => {
              const isCurrentPage = item.isActive || pathname === item.href
              const isExternal = item.href.startsWith('http')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={isExternal ? undefined : undefined}
                  rel={isExternal ? undefined : undefined}
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
          <button className="md:hidden p-[15px] -mr-[15px]">
            <div className="w-[21px] h-[16px] flex flex-col justify-between">
              <div className="w-full h-[2px] bg-black rounded-full" />
              <div className="w-full h-[2px] bg-black rounded-full" />
              <div className="w-full h-[2px] bg-black rounded-full" />
            </div>
          </button>
        </div>
      </nav>
    </header>
  )
}
