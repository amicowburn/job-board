import Image from 'next/image'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Toaster } from 'sonner'
import { getUser, isCurrentUserAdmin } from '@/lib/supabase/server'
import { getPendingSubmissionCount } from '@/lib/admin-data'
import { AdminNav } from '@/components/admin/admin-nav'

export const metadata = {
  title: 'Admin | MMSS Job Board',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  let pendingSubmissions = 0

  if (user) {
    // Independent of each other — the admin check reuses the request-cached
    // user, so run it alongside the count rather than waiting on it first.
    const [isAdmin, count] = await Promise.all([
      isCurrentUserAdmin(),
      getPendingSubmissionCount(),
    ])

    if (!isAdmin) {
      redirect('/admin/login?error=unauthorized')
    }

    pendingSubmissions = count
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#e8e8e8]">
      {user && (
        <header className="sticky top-0 z-50 px-[4vw] py-[15px]">
          <div>
            <div className="bg-white rounded-[15px] px-4 sm:px-[15px] flex items-center justify-between h-[50px] backdrop-blur-[10px]">
              {/* Left: logo + Admin label + nav */}
              <div className="flex items-center gap-4">
                <Link href="/admin/jobs" className="flex items-center gap-2 shrink-0">
                  <Image
                    src="/mmss-logo.png"
                    alt="MMSS"
                    width={80}
                    height={33}
                    className="h-[28px] w-auto object-contain"
                  />
                  <span
                    className="text-[11px] uppercase tracking-widest text-slate-400 font-medium hidden sm:block"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    Admin
                  </span>
                </Link>
                <AdminNav pendingSubmissions={pendingSubmissions} />
              </div>
              {/* Right: email + sign out */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden md:block truncate max-w-[180px]">
                  {user.email}
                </span>
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 px-4 sm:px-[15px] py-6 w-full max-w-[1200px] mx-auto">
        {children}
      </main>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
