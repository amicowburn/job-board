import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import { SiteMain } from '@/components/site-main'
import { Footer } from '@/components/footer'
import { SmoothScroll } from '@/components/smooth-scroll'
import { BottomBlur } from '@/components/bottom-blur'
import './globals.css'
import { cn } from "@/lib/utils";

// --font-inter is defined here on <html>, matching where --font-outfit is
// defined on <body> below — either position works for inheritance (custom
// properties cascade to all descendants, portals included, since a portal's
// target is still a DOM descendant of whichever element declared it), but
// this is also where `font-sans` (the Tailwind utility, applied to <html>
// two lines down) needs --font-inter already defined to resolve against —
// custom properties don't flow upward, so it has to be at or above the
// element that consumes it.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

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
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className={outfit.variable}>
        <SmoothScroll />
        <Navbar />
        <SiteMain>{children}</SiteMain>
        <Footer />
        <BottomBlur />
      </body>
    </html>
  )
}
