import { NextResponse } from 'next/server'
import { isCurrentUserAdmin, createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/users
 *
 * List all admin users with their email addresses. Emails can only be
 * resolved via the service-role client (auth.users isn't queryable with
 * the anon key), so this has to be a server route rather than a direct
 * client-side Supabase call.
 */
export async function GET() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerClient()
  const { data: adminUsers, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: true }) as {
      data: { id: string; is_admin: boolean; created_at: string }[] | null
      error: Error | null
    }

  if (error || !adminUsers) {
    return NextResponse.json({ error: 'Failed to load admin users' }, { status: 500 })
  }

  const adminClient = createAdminClient()
  const results = await Promise.all(
    adminUsers.map(async (row) => {
      const { data } = await adminClient.auth.admin.getUserById(row.id)
      return { ...row, email: data.user?.email ?? null }
    })
  )

  return NextResponse.json({ data: results })
}

/**
 * POST /api/admin/users
 *
 * Create a new admin account. Uses the service-role client so the acting
 * admin's own session isn't disturbed (client-side supabase.auth.signUp()
 * swaps the browser session to the newly created user).
 */
export async function POST(request: Request) {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message || 'Failed to create user' },
      { status: 500 }
    )
  }

  const { error: adminInsertError } = await adminClient
    .from('admin_users')
    .insert({ id: created.user.id, is_admin: true })

  if (adminInsertError) {
    // Roll back the auth user so we don't leave an orphaned non-admin account
    await adminClient.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: 'Failed to grant admin access' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: created.user.id, email })
}
