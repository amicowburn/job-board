import { createServerClient } from '@/lib/supabase/server'
import { SubmissionsTable } from '@/components/admin/submissions-table'
import type { JobSubmission } from '@/lib/types'

export const metadata = {
  title: 'Job Submissions | Admin | MMSS Job Board',
}

export default async function AdminSubmissionsPage() {
  const supabase = await createServerClient()

  const { data: submissions, count } = await supabase
    .from('job_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false }) as {
      data: JobSubmission[] | null
      count: number | null
    }

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Job Submissions</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve or reject job submissions from employers.
        </p>
      </div>
      <SubmissionsTable
        submissions={submissions || []}
        totalCount={count || 0}
      />
    </div>
  )
}
