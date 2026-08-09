import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { JobSubmissionForm } from '@/components/jobs/job-submission-form'
import type { JobSubmission } from '@/lib/types'

export const metadata = {
  title: 'Edit Submission | MMSS Job Board',
}

interface EditSubmissionPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function EditSubmissionPage({ searchParams }: EditSubmissionPageProps) {
  const { token } = await searchParams

  if (!token) notFound()

  const adminClient = createAdminClient()
  const { data: submission } = await adminClient
    .from('job_submissions')
    .select('*')
    .eq('edit_token', token)
    .single() as { data: JobSubmission | null }

  if (!submission) notFound()

  if (submission.status !== 'pending') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold text-slate-900 mb-2">
            {submission.status === 'approved' ? 'Submission Approved' : 'Submission Reviewed'}
          </h1>
          <p className="text-slate-500 text-sm">
            {submission.status === 'approved'
              ? 'Your job listing has been approved and is now live on the MMSS Job Board.'
              : 'Your submission has already been reviewed and can no longer be edited. Contact enquiries@monashmss.com with any questions.'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit Your Submission</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Update the details below and click &ldquo;Update Submission&rdquo;. Changes are only possible while your submission is still pending review.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <JobSubmissionForm
            existingSubmission={submission}
            editToken={token}
          />
        </div>
      </div>
    </div>
  )
}
