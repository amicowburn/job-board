import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('job_submissions')
    .update({ status: 'rejected', admin_note: body.admin_note || null })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to reject submission' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
