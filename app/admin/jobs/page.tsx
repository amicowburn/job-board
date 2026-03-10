import { createServerClient } from '@/lib/supabase/server'
import { JobTable } from '@/components/admin'

export const metadata = {
  title: 'Manage Jobs | Admin | MMSS Job Board',
}

export default async function AdminJobsPage() {
  const supabase = await createServerClient()

  // Fetch all jobs (including inactive)
  const { data: jobs, count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Manage Jobs</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage job listings
        </p>
      </div>

      <JobTable jobs={jobs || []} totalJobs={count || 0} />
    </div>
  )
}
