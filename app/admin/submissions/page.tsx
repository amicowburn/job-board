import { createServerClient } from '@/lib/supabase/server'
import { SubmissionsTable } from '@/components/admin/submissions-table'
import type { JobSubmission } from '@/lib/types'

export const metadata = {
  title: 'Job Submissions | Admin | MMSS Job Board',
}

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createServerClient()
  const { data: submissions, count } = await supabase
    .from('job_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to) as { data: JobSubmission[] | null; count: number | null }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-[22px] font-bold text-slate-800"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          Job Submissions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and approve or reject job submissions from employers.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <SubmissionsTable
          submissions={submissions ?? []}
          totalCount={count ?? 0}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  )
}
