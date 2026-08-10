// Database types for MMSS Job Board

export type WorkMode = 'remote' | 'hybrid' | 'onsite'
export type JobType = 'internship' | 'graduate' | 'part-time' | 'full-time' | 'casual' | 'contract'
export type FeedbackType = 'scam' | 'expired' | 'broken_link' | 'incorrect_info' | 'other'
export type FeedbackStatus = 'new' | 'reviewed' | 'removed'
export type JobSource = 'manual' | 'external_api' | string

// Database row types
export interface Job {
  id: string
  source: JobSource
  external_id: string | null
  title: string
  company: string
  location: string | null
  work_mode: WorkMode | null
  job_type: JobType | null
  url: string
  description: string | null
  company_logo_url: string | null
  tags: string[] | null
  posted_at: string | null
  closing_at: string | null
  is_active: boolean
  is_featured: boolean
  is_sponsored: boolean
  created_at: string
  updated_at: string
}

export interface JobFeedback {
  id: string
  job_id: string
  type: FeedbackType
  message: string | null
  email: string | null
  status: FeedbackStatus
  created_at: string
}

export interface AdminUser {
  id: string
  is_admin: boolean
  created_at: string
}

// Insert types (for creating new records)
export interface JobInsert {
  id?: string
  source?: JobSource
  external_id?: string | null
  title: string
  company: string
  location?: string | null
  work_mode?: WorkMode | null
  job_type?: JobType | null
  url: string
  description?: string | null
  company_logo_url?: string | null
  tags?: string[] | null
  posted_at?: string | null
  closing_at?: string | null
  is_active?: boolean
  is_featured?: boolean
  is_sponsored?: boolean
}

export interface JobFeedbackInsert {
  id?: string
  job_id: string
  type: FeedbackType
  message?: string | null
  email?: string | null
  status?: FeedbackStatus
}

// Update types (for updating existing records)
export interface JobUpdate {
  source?: JobSource
  external_id?: string | null
  title?: string
  company?: string
  location?: string | null
  work_mode?: WorkMode | null
  job_type?: JobType | null
  url?: string
  description?: string | null
  company_logo_url?: string | null
  tags?: string[] | null
  posted_at?: string | null
  closing_at?: string | null
  is_active?: boolean
  is_featured?: boolean
  is_sponsored?: boolean
}

export interface JobFeedbackUpdate {
  type?: FeedbackType
  message?: string | null
  email?: string | null
  status?: FeedbackStatus
}

// =====================
// Job Submission types
// =====================

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface JobSubmission {
  id: string
  submitter_name: string
  submitter_email: string
  submitter_company_name: string
  title: string
  company: string
  location: string | null
  work_mode: WorkMode | null
  job_type: JobType | null
  url: string
  description: string | null
  company_logo_url: string | null
  tags: string[] | null
  closing_at: string | null
  status: SubmissionStatus
  admin_note: string | null
  edit_token: string
  /** Set when an admin archives the row; NULL means it is still in the queue. */
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface JobSubmissionInsert {
  submitter_name: string
  submitter_email: string
  submitter_company_name: string
  title: string
  company: string
  location?: string | null
  work_mode?: WorkMode | null
  job_type?: JobType | null
  url: string
  description?: string | null
  company_logo_url?: string | null
  tags?: string[] | null
  closing_at?: string | null
}

export interface JobSubmissionUpdate {
  status?: SubmissionStatus
  admin_note?: string | null
  archived_at?: string | null
}

// Query filter types
export interface JobFilters {
  search?: string
  job_type?: JobType | JobType[]
  work_mode?: WorkMode | WorkMode[]
  source?: JobSource
  tags?: string[]
  is_active?: boolean
  is_featured?: boolean
  is_sponsored?: boolean
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Supabase Database type helper - matches Supabase codegen format
export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: Job
        Insert: JobInsert
        Update: JobUpdate
        Relationships: []
      }
      job_feedback: {
        Row: JobFeedback
        Insert: JobFeedbackInsert
        Update: JobFeedbackUpdate
        Relationships: [
          {
            foreignKeyName: 'job_feedback_job_id_fkey'
            columns: ['job_id']
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          }
        ]
      }
      job_submissions: {
        Row: JobSubmission
        Insert: JobSubmissionInsert
        Update: JobSubmissionUpdate
        Relationships: []
      }
      admin_users: {
        Row: AdminUser
        Insert: Omit<AdminUser, 'created_at'>
        Update: Partial<Omit<AdminUser, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/**
 * The subset of `Job` the admin jobs table renders.
 *
 * The table never shows `description` (full job HTML), so the admin list query
 * selects only these columns to keep the per-row payload small.
 */
export type AdminJobRow = Pick<
  Job,
  | 'id'
  | 'title'
  | 'company'
  | 'source'
  | 'is_active'
  | 'is_featured'
  | 'is_sponsored'
  | 'posted_at'
  | 'created_at'
>
