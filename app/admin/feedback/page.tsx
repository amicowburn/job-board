import { createServerClient } from '@/lib/supabase/server'
import { FeedbackTable } from '@/components/admin'

export const metadata = {
  title: 'Feedback | Admin | MMSS Job Board',
}

export default async function AdminFeedbackPage() {
  const supabase = await createServerClient()

  // Fetch feedback with job details
  const { data: feedback } = await supabase
    .from('job_feedback')
    .select(`
      *,
      jobs:job_id (
        id,
        title,
        company
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">User Feedback</h1>
        <p className="text-muted-foreground">
          Review and manage feedback from users
        </p>
      </div>

      <FeedbackTable feedback={feedback || []} />
    </div>
  )
}
