import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { submissionConfirmationEmail } from '@/lib/email-templates'
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
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const editLink = `${APP_URL}/submit/edit?token=${data.edit_token}`

    const [confirmResult, adminResult] = await Promise.allSettled([
      resend.emails.send({
        from: 'MMSS Job Board <noreply@monashmss.com>',
        to: data.submitter_email,
        subject: `Submission received: "${data.title}" at ${data.company}`,
        html: submissionConfirmationEmail(data),
        text: [
          `Hi ${data.submitter_name},`,
          '',
          `Thank you for submitting "${data.title}" at ${data.company} to the MMSS Job Board.`,
          'Our team will review your listing within 2–3 business days.',
          '',
          `Job title:  ${data.title}`,
          `Company:    ${data.company}`,
          data.location   ? `Location:   ${data.location}`   : null,
          data.job_type   ? `Job type:   ${data.job_type}`   : null,
          data.work_mode  ? `Work mode:  ${data.work_mode}`  : null,
          data.closing_at ? `Closes:     ${data.closing_at}` : null,
          `Apply URL:  ${data.url}`,
          '',
          `Edit your submission: ${editLink}`,
          `Questions? Email ${ADMIN_EMAIL}`,
        ].filter(Boolean).join('\n'),
      }),
      resend.emails.send({
        from: 'MMSS Job Board <noreply@monashmss.com>',
        to: ADMIN_EMAIL,
        subject: `New submission: ${data.title} at ${data.company}`,
        text: [
          'A new job submission is waiting for review.',
          '',
          `Job:          ${data.title} at ${data.company}`,
          `Submitted by: ${data.submitter_name} (${data.submitter_email})`,
          `Company:      ${data.submitter_company_name}`,
          `Apply URL:    ${data.url}`,
          '',
          `Review: ${APP_URL}/admin/submissions`,
        ].join('\n'),
      }),
    ])

    if (confirmResult.status === 'fulfilled' && confirmResult.value.error) {
      console.error('Failed to send confirmation email to submitter:', confirmResult.value.error)
    }
    if (adminResult.status === 'fulfilled' && adminResult.value.error) {
      console.error('Failed to send admin notification email:', adminResult.value.error)
    }
    if (confirmResult.status === 'rejected') {
      console.error('Confirmation email threw:', confirmResult.reason)
    }
    if (adminResult.status === 'rejected') {
      console.error('Admin notification email threw:', adminResult.reason)
    }
  } else {
    console.warn('RESEND_API_KEY not set — skipping submission emails')
  }

  return NextResponse.json({ success: true })
}
