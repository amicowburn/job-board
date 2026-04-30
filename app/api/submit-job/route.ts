import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import type { JobSubmissionInsert, JobSubmission } from '@/lib/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const ADMIN_EMAIL = 'enquires@monashmss.com'

export async function POST(request: Request) {
  let body: JobSubmissionInsert
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('job_submissions')
    .insert(body)
    .select()
    .single() as { data: JobSubmission | null; error: Error | null }

  if (error || !data) {
    console.error('Failed to insert submission:', error)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }

  // Send emails — failures are non-blocking
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const editLink = `${APP_URL}/submit/edit?token=${data.edit_token}`

    await Promise.all([
      // Confirmation to HR submitter
      resend.emails.send({
        from: `MMSS Job Board <noreply@monashmss.com>`,
        to: data.submitter_email,
        subject: `Your job listing "${data.title}" has been submitted`,
        text: [
          `Hi ${data.submitter_name},`,
          '',
          `Thank you for submitting "${data.title}" at ${data.company} to the MMSS Job Board.`,
          'Our team will review your listing within 2–3 business days.',
          '',
          'Need to make changes before we review it?',
          `Edit your submission here: ${editLink}`,
          '(This link is valid while your submission is still pending review.)',
          '',
          'Questions? Reply to this email or contact enquires@monashmss.com',
          '',
          'MMSS Job Board Team',
        ].join('\n'),
      }),
      // Notification to admin
      resend.emails.send({
        from: `MMSS Job Board <noreply@monashmss.com>`,
        to: ADMIN_EMAIL,
        subject: `New job submission: ${data.title} at ${data.company}`,
        text: [
          'A new job submission is waiting for review.',
          '',
          `Job: ${data.title} at ${data.company}`,
          `Submitted by: ${data.submitter_name} (${data.submitter_email})`,
          `Application URL: ${data.url}`,
          '',
          `Review it here: ${APP_URL}/admin/submissions`,
        ].join('\n'),
      }),
    ])
  } catch (emailError) {
    console.error('Failed to send notification emails:', emailError)
    // Do not fail the request — the submission is already saved
  }

  return NextResponse.json({ success: true })
}
