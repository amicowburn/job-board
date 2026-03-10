/**
 * Job Sync Logic
 * ===============
 * Handles the synchronization of jobs from external APIs to the database.
 */

import { createAdminClient } from './supabase/admin'
import { fetchExternalJobs } from './externalJobsAdapter'
import type { JobInsert } from './types'

// Configuration
const MARK_MISSING_INACTIVE = process.env.MARK_MISSING_INACTIVE === 'true'

export interface SyncResult {
  success: boolean
  inserted: number
  updated: number
  deactivated: number
  errors: string[]
  duration: number
}

/**
 * Run the job sync process
 */
export async function runJobSync(): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = {
    success: false,
    inserted: 0,
    updated: 0,
    deactivated: 0,
    errors: [],
    duration: 0,
  }

  try {
    console.log('Starting job sync...')

    // 1. Fetch jobs from external API
    const externalJobs = await fetchExternalJobs()
    console.log(`Fetched ${externalJobs.length} jobs from external API`)

    if (externalJobs.length === 0) {
      console.log('No jobs to sync')
      result.success = true
      result.duration = Date.now() - startTime
      return result
    }

    // 2. Upsert jobs into database
    const supabase = createAdminClient()

    // Track external IDs we've seen in this sync
    const syncedExternalIds = new Set<string>()

    for (const job of externalJobs) {
      try {
        const upsertResult = await upsertJob(supabase, job)

        if (upsertResult.isNew) {
          result.inserted++
        } else {
          result.updated++
        }

        if (job.external_id) {
          syncedExternalIds.add(job.external_id)
        }
      } catch (error) {
        const errorMsg = `Failed to upsert job "${job.title}": ${error}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    // 3. Optionally mark missing jobs as inactive
    if (MARK_MISSING_INACTIVE && syncedExternalIds.size > 0) {
      const deactivatedCount = await deactivateMissingJobs(
        supabase,
        syncedExternalIds
      )
      result.deactivated = deactivatedCount
    }

    result.success = true
    console.log(
      `Sync complete: ${result.inserted} inserted, ${result.updated} updated, ${result.deactivated} deactivated`
    )
  } catch (error) {
    const errorMsg = `Sync failed: ${error}`
    console.error(errorMsg)
    result.errors.push(errorMsg)
  }

  result.duration = Date.now() - startTime
  return result
}

/**
 * Upsert a single job into the database
 */
async function upsertJob(
  supabase: ReturnType<typeof createAdminClient>,
  job: JobInsert
): Promise<{ isNew: boolean }> {
  // Check if job exists by source + external_id
  const { data: existingJob } = await supabase
    .from('jobs')
    .select('id')
    .eq('source', job.source || 'external_api')
    .eq('external_id', job.external_id)
    .single()

  if (existingJob) {
    // Update existing job
    const { error } = await supabase
      .from('jobs')
      .update({
        title: job.title,
        company: job.company,
        location: job.location,
        work_mode: job.work_mode,
        job_type: job.job_type,
        url: job.url,
        description: job.description,
        tags: job.tags,
        posted_at: job.posted_at,
        closing_at: job.closing_at,
        is_active: true, // Re-activate if it was deactivated
        // Don't update is_featured - preserve admin setting
      })
      .eq('id', existingJob.id)

    if (error) throw error
    return { isNew: false }
  } else {
    // Insert new job
    const { error } = await supabase.from('jobs').insert(job)

    if (error) throw error
    return { isNew: true }
  }
}

/**
 * Deactivate jobs from external API that weren't seen in this sync
 */
async function deactivateMissingJobs(
  supabase: ReturnType<typeof createAdminClient>,
  syncedExternalIds: Set<string>
): Promise<number> {
  try {
    // Get all active external API jobs
    const { data: activeExternalJobs } = await supabase
      .from('jobs')
      .select('id, external_id')
      .eq('source', 'external_api')
      .eq('is_active', true)

    if (!activeExternalJobs || activeExternalJobs.length === 0) {
      return 0
    }

    // Find jobs not in the synced set
    const jobsToDeactivate = activeExternalJobs.filter(
      (job) => job.external_id && !syncedExternalIds.has(job.external_id)
    )

    if (jobsToDeactivate.length === 0) {
      return 0
    }

    // Deactivate them
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .in(
        'id',
        jobsToDeactivate.map((j) => j.id)
      )

    if (error) {
      console.error('Error deactivating missing jobs:', error)
      return 0
    }

    console.log(`Deactivated ${jobsToDeactivate.length} jobs not seen in sync`)
    return jobsToDeactivate.length
  } catch (error) {
    console.error('Error in deactivateMissingJobs:', error)
    return 0
  }
}

/**
 * Manual trigger to sync a single job (for testing)
 */
export async function syncSingleJob(job: JobInsert): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    await upsertJob(supabase, job)
    return true
  } catch (error) {
    console.error('Error syncing single job:', error)
    return false
  }
}
