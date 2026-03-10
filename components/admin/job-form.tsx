'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Textarea, Select, Label, Alert, AlertDescription, type SelectOption } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { Job, JobInsert, JobUpdate } from '@/lib/types'

const JOB_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select job type' },
  { value: 'internship', label: 'Internship' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'casual', label: 'Casual' },
  { value: 'contract', label: 'Contract' },
]

const WORK_MODE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select work mode' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

interface JobFormProps {
  job?: Job
  isEditing?: boolean
}

export function JobForm({ job, isEditing = false }: JobFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: job?.title || '',
    company: job?.company || '',
    location: job?.location || '',
    work_mode: job?.work_mode || '',
    job_type: job?.job_type || '',
    url: job?.url || '',
    description: job?.description || '',
    tags: job?.tags?.join(', ') || '',
    posted_at: job?.posted_at ? job.posted_at.split('T')[0] : '',
    closing_at: job?.closing_at ? job.closing_at.split('T')[0] : '',
    is_featured: job?.is_featured || false,
    is_active: job?.is_active ?? true,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const supabase = createClient()

      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const jobData: JobInsert | JobUpdate = {
        title: formData.title,
        company: formData.company,
        location: formData.location || null,
        work_mode: (formData.work_mode as Job['work_mode']) || null,
        job_type: (formData.job_type as Job['job_type']) || null,
        url: formData.url,
        description: formData.description || null,
        tags: tags.length > 0 ? tags : null,
        posted_at: formData.posted_at ? new Date(formData.posted_at).toISOString() : null,
        closing_at: formData.closing_at ? new Date(formData.closing_at).toISOString() : null,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      }

      if (isEditing && job) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', job.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('jobs')
          .insert({ ...jobData, source: 'manual' } as JobInsert)

        if (insertError) throw insertError
      }

      router.push('/admin/jobs')
      router.refresh()
    } catch (err) {
      console.error('Error saving job:', err)
      setError(err instanceof Error ? err.message : 'Failed to save job')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="title" required>Job Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Marketing Intern"
            required
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="company" required>Company</Label>
          <Input
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Company Name"
            required
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Melbourne, VIC"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="work_mode">Work Mode</Label>
          <Select
            id="work_mode"
            name="work_mode"
            value={formData.work_mode}
            onChange={handleChange}
            options={WORK_MODE_OPTIONS}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="job_type">Job Type</Label>
          <Select
            id="job_type"
            name="job_type"
            value={formData.job_type}
            onChange={handleChange}
            options={JOB_TYPE_OPTIONS}
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="url" required>Application URL</Label>
          <Input
            id="url"
            name="url"
            type="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://company.com/apply"
            required
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Job description..."
            rows={6}
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="marketing, social media, content (comma-separated)"
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate tags with commas
          </p>
        </div>

        <div>
          <Label htmlFor="posted_at">Posted Date</Label>
          <Input
            id="posted_at"
            name="posted_at"
            type="date"
            value={formData.posted_at}
            onChange={handleChange}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="closing_at">Closing Date</Label>
          <Input
            id="closing_at"
            name="closing_at"
            type="date"
            value={formData.closing_at}
            onChange={handleChange}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_featured"
            checked={formData.is_featured}
            onChange={handleChange}
            className="rounded border-border"
          />
          <span className="text-sm">Featured job (highlighted on homepage)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="rounded border-border"
          />
          <span className="text-sm">Active (visible to public)</span>
        </label>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {isEditing ? 'Update Job' : 'Create Job'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/jobs')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
