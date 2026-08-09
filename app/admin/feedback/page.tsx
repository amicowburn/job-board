import { createServerClient } from '@/lib/supabase/server'
import { FeedbackTable } from '@/components/admin'

export const metadata = {
  title: 'Feedback | Admin | MMSS Job Board',
}

const PAGE_SIZE = 30

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createServerClient()
  const { data: feedback, count } = await supabase
    .from('job_feedback')
    .select(`*, jobs:job_id (id, title, company)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-[22px] font-bold text-slate-800"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          User Feedback
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and manage feedback from users
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <FeedbackTable
          feedback={feedback ?? []}
          totalCount={count ?? 0}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  )
}
