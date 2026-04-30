'use client'

import { useState } from 'react'
import { Button, Input, Select, Label, Alert, AlertDescription, type SelectOption } from '@/components/ui'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { isValidEmail } from '@/lib/utils'
import type { JobSubmissionInsert, WorkMode, JobType } from '@/lib/types'

const JOB_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select job type (optional)' },
  { value: 'internship', label: 'Internship' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'casual', label: 'Casual' },
  { value: 'contract', label: 'Contract' },
]

const WORK_MODE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select work mode (optional)' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

interface JobSubmissionFormProps {
  existingSubmission?: {
    submitter_name: string
    submitter_email: string
    submitter_company_name: string
    title: string
    company: string
    location: string | null
    work_mode: string | null
    job_type: string | null
    url: string
    company_logo_url: string | null
    description: string | null
    tags: string[] | null
    closing_at: string | null
  }
  editToken?: string
}

export function JobSubmissionForm({ existingSubmission, editToken }: JobSubmissionFormProps) {
  const isEditing = !!editToken

  const [formData, setFormData] = useState({
    submitter_name: existingSubmission?.submitter_name || '',
    submitter_email: existingSubmission?.submitter_email || '',
    submitter_company_name: existingSubmission?.submitter_company_name || '',
    title: existingSubmission?.title || '',
    company: existingSubmission?.company || '',
    location: existingSubmission?.location || '',
    work_mode: existingSubmission?.work_mode || '',
    job_type: existingSubmission?.job_type || '',
    url: existingSubmission?.url || '',
    company_logo_url: existingSubmission?.company_logo_url || '',
    description: existingSubmission?.description || '',
    tags: existingSubmission?.tags?.join(', ') || '',
    closing_at: existingSubmission?.closing_at
      ? existingSubmission.closing_at.split('T')[0]
      : '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus('idle')
    setErrorMessage('')

    if (!isValidEmail(formData.submitter_email)) {
      setErrorMessage('Please enter a valid work email address.')
      setStatus('error')
      setIsSubmitting(false)
      return
    }

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const submission: JobSubmissionInsert = {
      submitter_name: formData.submitter_name,
      submitter_email: formData.submitter_email,
      submitter_company_name: formData.submitter_company_name,
      title: formData.title,
      company: formData.company,
      location: formData.location || null,
      work_mode: (formData.work_mode as WorkMode) || null,
      job_type: (formData.job_type as JobType) || null,
      url: formData.url,
      description: formData.description || null,
      company_logo_url: formData.company_logo_url || null,
      tags: tags.length > 0 ? tags : null,
      closing_at: formData.closing_at
        ? new Date(formData.closing_at).toISOString()
        : null,
    }

    try {
      const endpoint = isEditing
        ? `/api/submit-job/${editToken}`
        : '/api/submit-job'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to submit.')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'success') {
    return (
      <Alert variant="success">
        <AlertDescription>
          {isEditing
            ? 'Your submission has been updated. Our team will review it shortly.'
            : 'Thank you! Your job listing has been submitted for review. Our team will get back to you within 2–3 business days. Questions? Email enquires@monashmss.com'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Contact info */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Your Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="submitter_name" required>Your name</Label>
            <Input
              id="submitter_name"
              name="submitter_name"
              value={formData.submitter_name}
              onChange={handleChange}
              placeholder="Jane Smith"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="submitter_email" required>Work email</Label>
            <Input
              id="submitter_email"
              name="submitter_email"
              type="email"
              value={formData.submitter_email}
              onChange={handleChange}
              placeholder="jane@company.com"
              required
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="submitter_company_name" required>Company name (confirmation)</Label>
            <Input
              id="submitter_company_name"
              name="submitter_company_name"
              value={formData.submitter_company_name}
              onChange={handleChange}
              placeholder="Acme Corp"
              required
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* Job details */}
      <div className="border-t pt-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Job Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="title" required>Job title</Label>
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
            <Label htmlFor="company" required>Company (for the listing)</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Acme Corp"
              required
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
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
            <Label htmlFor="work_mode">Work mode</Label>
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
            <Label htmlFor="job_type">Job type</Label>
            <Select
              id="job_type"
              name="job_type"
              value={formData.job_type}
              onChange={handleChange}
              options={JOB_TYPE_OPTIONS}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="closing_at">Application closing date</Label>
            <Input
              id="closing_at"
              name="closing_at"
              type="date"
              value={formData.closing_at}
              onChange={handleChange}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="company_logo_url">Company logo URL</Label>
            <Input
              id="company_logo_url"
              name="company_logo_url"
              type="url"
              value={formData.company_logo_url}
              onChange={handleChange}
              placeholder="https://company.com/logo.png"
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="tags">Skills / tags</Label>
            <Input
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="marketing, social media, Excel (comma-separated)"
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Job description</Label>
            <div className="mt-1.5">
              <RichTextEditor
                content={formData.description}
                onChange={html => setFormData(prev => ({ ...prev, description: html }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <Button type="submit" variant="primary" loading={isSubmitting} className="w-full sm:w-auto">
          {isEditing ? 'Update Submission' : 'Submit Job Listing'}
        </Button>
      </div>
    </form>
  )
}
