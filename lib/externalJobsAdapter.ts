/**
 * External Jobs API Adapter
 * ===========================
 * This module handles fetching and normalizing jobs from external APIs.
 *
 * IMPORTANT: When the actual external API shape is known, update the
 * ExternalApiJob interface and mapExternalJob function accordingly.
 */

import { generateJobHash, normalizeWorkMode, normalizeJobType } from './utils'
import type { JobInsert, ExternalJob } from './types'

// Configuration
const EXTERNAL_API_URL = process.env.EXTERNAL_JOBS_API_URL
const EXTERNAL_API_KEY = process.env.EXTERNAL_JOBS_API_KEY

/**
 * Raw response shape from external API
 * UPDATE THIS when the actual API schema is known
 */
interface ExternalApiJob {
  // Common field names - adjust based on actual API
  id?: string
  external_id?: string
  job_id?: string
  reference?: string

  // Job details
  title: string
  company?: string
  company_name?: string
  organisation?: string
  employer?: string

  // Location
  location?: string
  city?: string
  state?: string
  country?: string

  // Work mode
  work_mode?: string
  work_type?: string
  remote?: boolean
  is_remote?: boolean

  // Job type
  job_type?: string
  type?: string
  employment_type?: string
  category?: string

  // URLs
  url?: string
  apply_url?: string
  application_url?: string
  link?: string

  // Description
  description?: string
  summary?: string
  details?: string

  // Tags/Skills
  tags?: string[]
  skills?: string[]
  keywords?: string[]

  // Dates
  posted_at?: string
  posted_date?: string
  publish_date?: string
  created_at?: string

  closing_at?: string
  closing_date?: string
  expiry_date?: string
  deadline?: string

  // Allow additional unknown fields
  [key: string]: unknown
}

/**
 * External API response shape
 * UPDATE THIS based on actual API response structure
 */
interface ExternalApiResponse {
  // Could be jobs, data, results, items, etc.
  jobs?: ExternalApiJob[]
  data?: ExternalApiJob[]
  results?: ExternalApiJob[]
  items?: ExternalApiJob[]

  // Pagination info (if applicable)
  total?: number
  page?: number
  per_page?: number
  has_more?: boolean
  next_cursor?: string
}

/**
 * Fetch jobs from external API
 * Returns normalized job data ready for upserting
 */
export async function fetchExternalJobs(): Promise<JobInsert[]> {
  if (!EXTERNAL_API_URL) {
    console.warn('EXTERNAL_JOBS_API_URL not configured, skipping external fetch')
    return []
  }

  try {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }

    // Add API key if configured
    if (EXTERNAL_API_KEY) {
      // Common auth header patterns - adjust as needed
      headers['Authorization'] = `Bearer ${EXTERNAL_API_KEY}`
      // OR: headers['X-API-Key'] = EXTERNAL_API_KEY
      // OR: headers['Api-Key'] = EXTERNAL_API_KEY
    }

    const response = await fetch(EXTERNAL_API_URL, {
      method: 'GET',
      headers,
      next: { revalidate: 0 }, // Don't cache
    })

    if (!response.ok) {
      throw new Error(`External API error: ${response.status} ${response.statusText}`)
    }

    const data: ExternalApiResponse = await response.json()

    // Extract jobs array from response
    // UPDATE THIS based on actual API response structure
    const rawJobs = data.jobs || data.data || data.results || data.items || []

    // Handle pagination if needed
    // This is a basic implementation - adjust based on actual API
    let allJobs = [...rawJobs]

    // Example: If API uses cursor-based pagination
    // let cursor = data.next_cursor
    // while (cursor) {
    //   const nextResponse = await fetch(`${EXTERNAL_API_URL}?cursor=${cursor}`, { headers })
    //   const nextData = await nextResponse.json()
    //   allJobs = [...allJobs, ...(nextData.jobs || [])]
    //   cursor = nextData.next_cursor
    // }

    // Map and normalize jobs
    const normalizedJobs = allJobs
      .map(mapExternalJob)
      .filter((job): job is JobInsert => job !== null)

    console.log(`Fetched ${normalizedJobs.length} jobs from external API`)
    return normalizedJobs
  } catch (error) {
    console.error('Error fetching external jobs:', error)
    throw error
  }
}

/**
 * Map an external API job to our internal format
 * UPDATE THIS when the actual API schema is known
 */
function mapExternalJob(job: ExternalApiJob): JobInsert | null {
  try {
    // Extract title (required)
    const title = job.title?.trim()
    if (!title) {
      console.warn('Skipping job without title:', job.id || job.external_id)
      return null
    }

    // Extract company (required)
    const company = (
      job.company ||
      job.company_name ||
      job.organisation ||
      job.employer ||
      ''
    ).trim()
    if (!company) {
      console.warn('Skipping job without company:', title)
      return null
    }

    // Extract URL (required)
    const url = (
      job.url ||
      job.apply_url ||
      job.application_url ||
      job.link ||
      ''
    ).trim()
    if (!url) {
      console.warn('Skipping job without URL:', title)
      return null
    }

    // Extract external ID or generate hash
    const externalId =
      job.external_id ||
      job.id ||
      job.job_id ||
      job.reference ||
      null

    // Extract location
    const location = extractLocation(job)

    // Extract work mode
    const workMode = normalizeWorkMode(
      job.work_mode || job.work_type || (job.remote || job.is_remote ? 'remote' : null)
    )

    // Extract job type
    const jobType = normalizeJobType(
      job.job_type || job.type || job.employment_type || job.category
    )

    // Extract description
    const description = (
      job.description ||
      job.summary ||
      job.details ||
      ''
    ).trim() || null

    // Extract tags
    const tags = extractTags(job)

    // Extract dates
    const postedAt = parseDate(
      job.posted_at || job.posted_date || job.publish_date || job.created_at
    )
    const closingAt = parseDate(
      job.closing_at || job.closing_date || job.expiry_date || job.deadline
    )

    // Generate hash if no external ID
    const finalExternalId = externalId || generateJobHash(title, company, url, postedAt)

    return {
      source: 'external_api',
      external_id: finalExternalId,
      title,
      company,
      location,
      work_mode: workMode,
      job_type: jobType,
      url,
      description,
      tags: tags.length > 0 ? tags : null,
      posted_at: postedAt,
      closing_at: closingAt,
      is_active: true,
      is_featured: false,
    }
  } catch (error) {
    console.error('Error mapping external job:', error, job)
    return null
  }
}

/**
 * Extract location from various possible fields
 */
function extractLocation(job: ExternalApiJob): string | null {
  if (job.location) return job.location.trim()

  const parts = [job.city, job.state, job.country].filter(Boolean)
  if (parts.length > 0) return parts.join(', ')

  return null
}

/**
 * Extract and normalize tags from various possible fields
 */
function extractTags(job: ExternalApiJob): string[] {
  const allTags: string[] = []

  if (Array.isArray(job.tags)) allTags.push(...job.tags)
  if (Array.isArray(job.skills)) allTags.push(...job.skills)
  if (Array.isArray(job.keywords)) allTags.push(...job.keywords)

  // Normalize: lowercase, trim, remove duplicates
  const normalized = allTags
    .map((tag) => tag.toLowerCase().trim())
    .filter((tag) => tag.length > 0 && tag.length < 50) // Basic validation

  return [...new Set(normalized)]
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString()
  } catch {
    return null
  }
}

/**
 * Type guard to check if job data is valid
 */
export function isValidExternalJob(job: unknown): job is ExternalJob {
  if (!job || typeof job !== 'object') return false
  const j = job as Record<string, unknown>
  return typeof j.title === 'string' && j.title.length > 0
}
