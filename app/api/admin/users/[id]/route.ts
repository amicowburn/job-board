import { NextResponse } from 'next/server'
import { isCurrentUserAdmin, getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * DELETE /api/admin/users/[id]
 *
 * Revoke admin access. This only removes the admin_users row (the
 * underlying auth account is left intact) — same behaviour as before,
 * just moved server-side for consistency with create.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = await getUser()
  if (currentUser?.id === id) {
    return NextResponse.json({ error: 'You cannot remove your own admin access' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('admin_users').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
