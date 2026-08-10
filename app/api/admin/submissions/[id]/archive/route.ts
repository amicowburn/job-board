import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { isCurrentUserAdmin, createServerClient } from '@/lib/supabase/server'
import { SUBMISSIONS_TAG } from '@/lib/admin-data'

/**
 * Archive or restore a submission.
 *
 * Archiving takes a row out of the admin queue without discarding it — the
 * employer's details, the decision trail and the `edit_token` behind their
 * /submit/edit link all survive, and the action is reversible. Sending
 * `{ archived: false }` restores it.
 *
 * No email is sent either way: archiving is internal housekeeping, not a
 * decision about the submission, so the submitter should not hear about it.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let archived = true
  try {
    const body = await request.json()
    if (typeof body?.archived === 'boolean') archived = body.archived
  } catch {
    // No body — default to archiving.
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('job_submissions')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Failed to archive submission:', error)
    return NextResponse.json(
      { error: archived ? 'Failed to archive submission' : 'Failed to restore submission' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // A pending row leaving or rejoining the queue changes the nav badge count.
  revalidateTag(SUBMISSIONS_TAG)

  return NextResponse.json({ success: true, archived })
}
