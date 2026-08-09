import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isCurrentUserAdmin } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import { rejectionEmail } from '@/lib/email-templates'

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

  // Fetch submission details before updating (needed for the email)
  const { data: submission, error: fetchError } = await supabase
    .from('job_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('job_submissions')
    .update({ status: 'rejected', admin_note: body.admin_note || null })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to reject submission' }, { status: 500 })
  }

  // Notify the HR submitter their listing wasn't approved (non-blocking)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'MMSS Job Board <noreply@monashmss.com>',
      to: submission.submitter_email,
      subject: `An update on your submission: "${submission.title}"`,
      html: rejectionEmail(submission, body.admin_note),
      text: [
        `Hi ${submission.submitter_name},`,
        '',
        `Thank you for submitting "${submission.title}" at ${submission.company}.`,
        "Unfortunately we weren't able to feature this listing on the MMSS Job Board at this time.",
        body.admin_note ? `\nNote from our team: ${body.admin_note}\n` : '',
        'Have another role? Submit again at:',
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/submit`,
        '',
        `Questions? Email enquiries@monashmss.com`,
        'MMSS Job Board Team',
      ].filter(l => l !== null).join('\n'),
    })
  } catch (emailError) {
    console.error('Failed to send rejection email:', emailError)
  }

  return NextResponse.json({ success: true })
}
