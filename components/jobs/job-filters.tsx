'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  Button,
  Input,
  NativeSelect,
  NativeSelectOption,
  type SelectOption,
} from '@/components/ui'
import type { JobType, WorkMode } from '@/lib/types'

const JOB_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All types' },
  { value: 'internship', label: 'Internship' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'casual', label: 'Casual' },
  { value: 'contract', label: 'Contract' },
]

const WORK_MODE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All work modes' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

const SORT_OPTIONS: SelectOption[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'closing', label: 'Closing soon' },
]

interface JobFiltersProps {
  className?: string
}

export function JobFilters({ className }: JobFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [jobType, setJobType] = useState<JobType | ''>(
    (searchParams.get('type') as JobType) || ''
  )
  const [workMode, setWorkMode] = useState<WorkMode | ''>(
    (searchParams.get('work_mode') as WorkMode) || ''
  )
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')

  const updateFilters = (updates: Record<string, string>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())

      // Reset to page 1 when filters change
      params.delete('page')

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      router.push(`/jobs?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ q: search })
  }

  const handleReset = () => {
    setSearch('')
    setJobType('')
    setWorkMode('')
    setSort('newest')
    startTransition(() => {
      router.push('/jobs')
    })
  }

  const hasFilters = search || jobType || workMode || sort !== 'newest'

  return (
    <div className={className}>
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="primary" disabled={isPending}>
            Search
          </Button>
        </div>
      </form>

      {/* Filters */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Job Type
          </label>
          <NativeSelect
            value={jobType}
            onChange={(e) => {
              setJobType(e.target.value as JobType | '')
              updateFilters({ type: e.target.value })
            }}
          >
            {JOB_TYPE_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Work Mode
          </label>
          <NativeSelect
            value={workMode}
            onChange={(e) => {
              setWorkMode(e.target.value as WorkMode | '')
              updateFilters({ work_mode: e.target.value })
            }}
          >
            {WORK_MODE_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Sort By
          </label>
          <NativeSelect
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              updateFilters({ sort: e.target.value })
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="w-full"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      )}
    </div>
  )
}
