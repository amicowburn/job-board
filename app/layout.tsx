import type { Metadata } from 'next'
import { Public_Sans } from 'next/font/google'
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
    <html lang="en" className={cn("font-sans", publicSans.variable)}>
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
