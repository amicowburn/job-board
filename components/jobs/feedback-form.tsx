'use client'

import { useState } from 'react'
import { Button, Select, Textarea, Input, Alert, AlertDescription, type SelectOption } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { isValidEmail } from '@/lib/utils'
import type { FeedbackType } from '@/lib/types'

const FEEDBACK_TYPE_OPTIONS: SelectOption[] = [
  { value: 'scam', label: 'Potential scam' },
  { value: 'expired', label: 'Job expired / filled' },
  { value: 'broken_link', label: 'Broken apply link' },
  { value: 'incorrect_info', label: 'Incorrect information' },
  { value: 'other', label: 'Other issue' },
]

interface FeedbackFormProps {
  jobId: string
}

export function FeedbackForm({ jobId }: FeedbackFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<FeedbackType | ''>('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!type) {
      setErrorMessage('Please select a feedback type')
      setStatus('error')
      return
    }

    if (email && !isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address')
      setStatus('error')
      return
    }

    setIsSubmitting(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const supabase = createClient()

      const { error } = await supabase.from('job_feedback').insert({
        job_id: jobId,
        type,
        message: message || null,
        email: email || null,
      })

      if (error) throw error

      setStatus('success')
      setType('')
      setMessage('')
      setEmail('')

      // Close form after success
      setTimeout(() => {
        setIsOpen(false)
        setStatus('idle')
      }, 2000)
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setStatus('error')
      setErrorMessage('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
      >
        <FlagIcon className="h-4 w-4" />
        Report an issue with this listing
      </button>
    )
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Report an issue</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {status === 'success' ? (
        <Alert variant="success">
          <AlertDescription>
            Thank you for your feedback! We&apos;ll review it shortly.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium block mb-1.5">
              Issue type <span className="text-destructive">*</span>
            </label>
            <Select
              options={FEEDBACK_TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as FeedbackType)}
              placeholder="Select an issue type"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">
              Additional details
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide any additional information..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">
              Your email (optional)
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              We may contact you if we need more information
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!type}
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 12.25v-8.5a.75.75 0 0 0-.904-.734l-2.38.501a7.25 7.25 0 0 1-4.186-.363l-.502-.2a8.75 8.75 0 0 0-5.053-.439l-1.475.31V2.75Z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  )
}
