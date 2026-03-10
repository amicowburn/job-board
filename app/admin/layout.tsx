import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, isCurrentUserAdmin } from '@/lib/supabase/server'
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

  // Allow access to login page without auth
  // The middleware handles the redirect for non-login pages

  // If user is logged in, check admin status for non-login pages
  if (user) {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      redirect('/admin/login?error=unauthorized')
    }
  }

  // If not logged in, the middleware will redirect to login
  // For the login page itself, we just render children

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Header */}
      {user && (
        <header className="bg-foreground text-background border-b">
          <div className="container-page flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin/jobs" className="font-bold text-lg">
                MMSS Admin
              </Link>
              <AdminNav />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-background/70">{user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-background/70 hover:text-background"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
