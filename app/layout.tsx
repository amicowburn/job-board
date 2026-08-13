import type { Metadata } from 'next'
import { Inter, Outfit, Montserrat, Roboto } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { SmoothScroll } from '@/components/smooth-scroll'
import { BottomBlur } from '@/components/bottom-blur'
import './globals.css'
import { cn } from "@/lib/utils";

const roboto = Roboto({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })
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
    <html lang="en" className={cn("font-sans", roboto.variable)}>
      <body className={`${inter.className} ${outfit.variable}`}>
        <SmoothScroll />
        <Navbar />
        <main className="min-h-screen pt-20">
          {children}
        </main>
        <Footer />
        <BottomBlur />
      </body>
    </html>
  )
}
