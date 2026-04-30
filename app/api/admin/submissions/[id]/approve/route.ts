import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerClient()

  // Fetch the pending submission
  const { data: submission, error: fetchError } = await supabase
    .from('job_submissions')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single()

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission not found or already actioned' }, { status: 404 })
  }

  // Insert into live jobs table using service-role client (bypasses RLS)
  const adminClient = createAdminClient()
  const { error: insertError } = await adminClient.from('jobs').insert({
    source: 'submission',
    title: submission.title,
    company: submission.company,
    location: submission.location,
    work_mode: submission.work_mode,
    job_type: submission.job_type,
    url: submission.url,
    description: submission.description,
    company_logo_url: submission.company_logo_url,
    tags: submission.tags,
    posted_at: new Date().toISOString(),
    closing_at: submission.closing_at,
    is_active: true,
    is_featured: false,
    is_sponsored: false,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to publish job' }, { status: 500 })
  }

  // Mark submission as approved
  await supabase
    .from('job_submissions')
    .update({ status: 'approved' })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
