import Link from 'next/link'
import { Button } from '@/components/ui'

export default function JobNotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Job Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This job listing may have been removed or is no longer available.
        </p>
        <Link href="/jobs">
          <Button variant="primary">Browse All Jobs</Button>
        </Link>
      </div>
    </main>
  )
}
