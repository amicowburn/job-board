import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

type CookieToSet = { name: string; value: string; options: CookieOptions }

/**
 * Creates a Supabase client for use in server components and route handlers.
 * Uses the anon key with RLS enforcement.
 * Handles cookie-based authentication automatically.
 *
 * Note: Type assertions should be used at query sites for type safety.
 */
export const createServerClient = cache(async () => {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
})

/**
 * Get the current authenticated user (if any).
 *
 * Wrapped in React `cache` so the round trip to Supabase Auth happens at most
 * once per request, no matter how many callers ask. The admin layout and the
 * page it renders both need the user, and `isCurrentUserAdmin` needs it again —
 * without this that is three separate network calls to validate one JWT.
 */
export const getUser = cache(async () => {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Check if the current user is an admin.
 *
 * Also request-cached — the layout calls this on every admin page render, and
 * middleware has already performed the same check for the same request.
 */
export const isCurrentUserAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser()

  if (!user) return false

  const supabase = await createServerClient()
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('is_admin')
    .eq('id', user.id)
    .single() as { data: { is_admin: boolean } | null }

  return adminUser?.is_admin ?? false
})

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
