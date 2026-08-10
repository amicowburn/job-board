import { createServerClient } from '@/lib/supabase/server'
import { SubmissionsTable } from '@/components/admin/submissions-table'
import type { JobSubmission } from '@/lib/types'

export const metadata = {
  title: 'Job Submissions | Admin | MMSS Job Board',
}

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ page?: string; view?: string }>
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const { page: pageParam, view } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // The queue shows live submissions; archived rows are kept but hidden behind
  // ?view=archived so nothing is ever silently lost.
  const showArchived = view === 'archived'

  const supabase = await createServerClient()
  const query = supabase
    .from('job_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data: submissions, count } = await (showArchived
    ? query.not('archived_at', 'is', null)
    : query.is('archived_at', null)) as { data: JobSubmission[] | null; count: number | null }

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
          {showArchived
            ? 'Archived submissions. Nothing here is deleted — restore any row to send it back to the queue.'
            : 'Review and approve or reject job submissions from employers.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <SubmissionsTable
          submissions={submissions ?? []}
          totalCount={count ?? 0}
          currentPage={currentPage}
          totalPages={totalPages}
          showArchived={showArchived}
        />
      </div>
    </div>
  )
}
