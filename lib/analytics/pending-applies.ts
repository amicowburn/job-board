import { APPLY_CONFIRM_MAX_AGE_MS, APPLY_CONFIRM_MIN_AGE_MS } from './constants'

/**
 * The "did you finish applying?" queue.
 *
 * Clicking Apply opens the employer's site in a new tab, so the board tab stays
 * alive and the visitor almost always comes back to it. That return is the only
 * moment this system can learn whether an application actually happened, so a
 * click parks a record here and the prompt picks it up when the tab regains
 * focus (or on the next visit, since this outlives the session).
 *
 * Storage is injected rather than reaching for `window` directly so all of this
 * is testable without a DOM, and so a browser with storage blocked degrades to
 * "no prompt" instead of throwing on a job seeker mid-application.
 */

const STORAGE_KEY = 'mmss_pending_applies'

/** Never queue more than this — a runaway list would be a prompt loop. */
const MAX_PENDING = 12

export interface PendingApply {
  jobId: string
  title: string
  company: string
  /** Epoch ms of the apply click. */
  at: number
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    // Storage access can throw outright under strict privacy settings.
    return null
  }
}

function isPendingApply(value: unknown): value is PendingApply {
  const v = value as Partial<PendingApply> | null
  return (
    !!v &&
    typeof v.jobId === 'string' &&
    typeof v.title === 'string' &&
    typeof v.company === 'string' &&
    typeof v.at === 'number' &&
    Number.isFinite(v.at)
  )
}

/**
 * Read the queue, discarding anything malformed.
 *
 * Tolerant on purpose: this key is in the visitor's own localStorage, so it can
 * be edited, truncated, or left over from an older shape. None of that should
 * break the job board.
 */
export function readPendingApplies(storage: StorageLike | null = defaultStorage()): PendingApply[] {
  if (!storage) return []

  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isPendingApply) : []
  } catch {
    return []
  }
}

function write(entries: PendingApply[], storage: StorageLike | null): void {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_PENDING)))
  } catch {
    // Quota or blocked storage — tracking is best-effort, never fatal.
  }
}

/**
 * Queue an apply click for later confirmation.
 *
 * Re-clicking the same job replaces the existing entry rather than adding a
 * second one, so a visitor who opens the employer twice is asked once.
 */
export function recordPendingApply(
  entry: PendingApply,
  storage: StorageLike | null = defaultStorage()
): void {
  const others = readPendingApplies(storage).filter((p) => p.jobId !== entry.jobId)
  write([...others, entry], storage)
}

export function clearPendingApply(
  jobId: string,
  storage: StorageLike | null = defaultStorage()
): void {
  write(
    readPendingApplies(storage).filter((p) => p.jobId !== jobId),
    storage
  )
}

/**
 * The entry to prompt about, if any — oldest eligible first.
 *
 * Eligible means old enough that the visitor has plausibly finished (or given
 * up), and recent enough that they will remember. Anything past the upper bound
 * is dropped silently rather than asked about.
 */
export function nextApplyToConfirm(
  now: number,
  storage: StorageLike | null = defaultStorage()
): PendingApply | null {
  const entries = readPendingApplies(storage)
  const live = entries.filter((p) => now - p.at <= APPLY_CONFIRM_MAX_AGE_MS)

  // Expiring here keeps the queue from growing without a separate sweep.
  if (live.length !== entries.length) write(live, storage)

  const ready = live
    .filter((p) => now - p.at >= APPLY_CONFIRM_MIN_AGE_MS)
    .sort((a, b) => a.at - b.at)

  return ready[0] ?? null
}
