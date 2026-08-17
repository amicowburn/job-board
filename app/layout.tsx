import type { Metadata } from 'next'
import { Public_Sans, Outfit } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import { SiteMain } from '@/components/site-main'
import { Footer } from '@/components/footer'
import { SmoothScroll } from '@/components/smooth-scroll'
import { BottomBlur } from '@/components/bottom-blur'
import './globals.css'
import { cn } from "@/lib/utils";

// Single app font. --font-sans and --font-heading both resolve to this —
// defined here on <html>, the same position --font-inter/--font-outfit used
// to occupy, so it's already in scope wherever font-sans/font-heading are
// consumed (custom properties don't flow upward, so it has to be at or above
// the element that reads it) and inherits to every descendant, portals
// included.
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' })

// Nav-only. --font-outfit is consumed directly via inline
// style={{ fontFamily: 'var(--font-outfit)' }} at the nav link call sites
// (components/navbar.tsx, components/admin/admin-nav.tsx) rather than
// through a font-heading/font-sans token, so reintroducing it here doesn't
// touch the rest of the app — every other font-heading consumer still
// resolves to Public Sans.
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' })

export const metadata: Metadata = {
  title: 'MMSS Job Board | Monash Marketing Students\' Society',
  description: 'Find marketing internships, graduate roles, and career opportunities curated for Monash marketing students.',
  keywords: ['marketing jobs', 'internships', 'graduate roles', 'Monash', 'MMSS', 'career opportunities'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("font-sans", publicSans.variable, outfit.variable)}>
      <body>
        <SmoothScroll />
        <Navbar />
        <SiteMain>{children}</SiteMain>
        <Footer />
        <BottomBlur />
      </body>
    </html>
  )
}
