import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { JobForm } from '@/components/admin'
import type { Job } from '@/lib/types'

interface EditJobPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditJobPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('title')
    .eq('id', id)
    .single() as { data: { title: string } | null }

  return {
    title: job ? `Edit: ${job.title} | Admin | MMSS Job Board` : 'Edit Job | Admin',
  }
}

export default async function AdminEditJobPage({ params }: EditJobPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single() as { data: Job | null; error: Error | null }

  if (error || !job) {
    notFound()
  }

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Job</h1>
        <p className="text-muted-foreground">
          Update job listing details
        </p>
      </div>

      <JobForm job={job} isEditing />
    </div>
  )
}
