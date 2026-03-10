import { JobForm } from '@/components/admin'

export const metadata = {
  title: 'Add Job | Admin | MMSS Job Board',
}

export default function AdminNewJobPage() {
  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add New Job</h1>
        <p className="text-muted-foreground">
          Create a new job listing
        </p>
      </div>

      <JobForm />
    </div>
  )
}
