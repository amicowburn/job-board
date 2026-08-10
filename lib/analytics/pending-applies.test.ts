import { describe, it, expect, beforeEach } from 'vitest'
import {
  readPendingApplies,
  recordPendingApply,
  clearPendingApply,
  nextApplyToConfirm,
  type PendingApply,
  type StorageLike,
} from './pending-applies'
import { APPLY_CONFIRM_MAX_AGE_MS, APPLY_CONFIRM_MIN_AGE_MS } from './constants'

/**
 * Storage is injected in every case, so none of this touches a DOM and the
 * clock is always explicit.
 */
function fakeStorage(initial?: string): StorageLike & { raw: () => string | null } {
  let value: string | null = initial ?? null
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next
    },
    raw: () => value,
  }
}

const NOW = 1_800_000_000_000

const entry = (over: Partial<PendingApply> = {}): PendingApply => ({
  jobId: 'job-1',
  title: 'Marketing Intern',
  company: 'Acme',
  at: NOW,
  ...over,
})

let storage: ReturnType<typeof fakeStorage>

beforeEach(() => {
  storage = fakeStorage()
})

describe('recordPendingApply', () => {
  it('stores an entry that can be read back', () => {
    recordPendingApply(entry(), storage)
    expect(readPendingApplies(storage)).toEqual([entry()])
  })

  it('keeps separate jobs separate', () => {
    recordPendingApply(entry({ jobId: 'a' }), storage)
    recordPendingApply(entry({ jobId: 'b' }), storage)
    expect(readPendingApplies(storage).map((p) => p.jobId)).toEqual(['a', 'b'])
  })

  it('replaces rather than duplicates when the same job is re-clicked', () => {
    // Opening the employer twice is one application to ask about, not two.
    recordPendingApply(entry({ at: NOW }), storage)
    recordPendingApply(entry({ at: NOW + 5_000 }), storage)

    const stored = readPendingApplies(storage)
    expect(stored).toHaveLength(1)
    expect(stored[0].at).toBe(NOW + 5_000)
  })

  it('caps the queue so it cannot grow without bound', () => {
    for (let i = 0; i < 20; i++) {
      recordPendingApply(entry({ jobId: `job-${i}` }), storage)
    }
    const stored = readPendingApplies(storage)
    expect(stored.length).toBeLessThanOrEqual(12)
    // The most recent clicks are the ones worth asking about.
    expect(stored[stored.length - 1].jobId).toBe('job-19')
  })
})

describe('clearPendingApply', () => {
  it('removes only the named job', () => {
    recordPendingApply(entry({ jobId: 'a' }), storage)
    recordPendingApply(entry({ jobId: 'b' }), storage)

    clearPendingApply('a', storage)

    expect(readPendingApplies(storage).map((p) => p.jobId)).toEqual(['b'])
  })

  it('is a no-op for a job that was never queued', () => {
    recordPendingApply(entry({ jobId: 'a' }), storage)
    clearPendingApply('nope', storage)
    expect(readPendingApplies(storage)).toHaveLength(1)
  })
})

describe('nextApplyToConfirm', () => {
  it('returns nothing while the click is still too fresh', () => {
    // The employer's tab is probably still loading — asking now reads as broken.
    recordPendingApply(entry({ at: NOW }), storage)
    expect(nextApplyToConfirm(NOW + 1_000, storage)).toBeNull()
  })

  it('returns the entry once it is old enough', () => {
    recordPendingApply(entry({ at: NOW }), storage)
    expect(nextApplyToConfirm(NOW + APPLY_CONFIRM_MIN_AGE_MS, storage)?.jobId).toBe('job-1')
  })

  it('ignores and drops entries past the maximum age', () => {
    recordPendingApply(entry({ at: NOW }), storage)

    const wayLater = NOW + APPLY_CONFIRM_MAX_AGE_MS + 1
    expect(nextApplyToConfirm(wayLater, storage)).toBeNull()
    // Expiry is also a sweep, so the queue does not accumulate dead entries.
    expect(readPendingApplies(storage)).toEqual([])
  })

  it('keeps an entry that is exactly at the maximum age', () => {
    recordPendingApply(entry({ at: NOW }), storage)
    expect(nextApplyToConfirm(NOW + APPLY_CONFIRM_MAX_AGE_MS, storage)?.jobId).toBe('job-1')
  })

  it('asks about the oldest eligible entry first', () => {
    recordPendingApply(entry({ jobId: 'newer', at: NOW + 10_000 }), storage)
    recordPendingApply(entry({ jobId: 'older', at: NOW }), storage)

    expect(nextApplyToConfirm(NOW + APPLY_CONFIRM_MIN_AGE_MS + 20_000, storage)?.jobId).toBe('older')
  })

  it('skips fresh entries but still surfaces an older eligible one', () => {
    recordPendingApply(entry({ jobId: 'old', at: NOW }), storage)
    const later = NOW + APPLY_CONFIRM_MIN_AGE_MS
    recordPendingApply(entry({ jobId: 'fresh', at: later }), storage)

    expect(nextApplyToConfirm(later, storage)?.jobId).toBe('old')
  })

  it('returns nothing on an empty queue', () => {
    expect(nextApplyToConfirm(NOW, storage)).toBeNull()
  })
})

describe('resilience', () => {
  it('survives malformed JSON in storage', () => {
    const broken = fakeStorage('{not json')
    expect(readPendingApplies(broken)).toEqual([])
    expect(nextApplyToConfirm(NOW, broken)).toBeNull()
  })

  it('survives a non-array payload', () => {
    expect(readPendingApplies(fakeStorage('{"jobId":"a"}'))).toEqual([])
  })

  it('drops entries of the wrong shape but keeps valid siblings', () => {
    // This key lives in the visitor's own localStorage and can be anything.
    const mixed = fakeStorage(
      JSON.stringify([
        { jobId: 'good', title: 'T', company: 'C', at: NOW },
        { jobId: 'missing-fields' },
        { jobId: 'bad-time', title: 'T', company: 'C', at: 'yesterday' },
        null,
        42,
      ])
    )

    expect(readPendingApplies(mixed).map((p) => p.jobId)).toEqual(['good'])
  })

  it('degrades to no prompt when storage is unavailable', () => {
    // Private browsing or blocked storage must not throw at a job seeker.
    expect(() => recordPendingApply(entry(), null)).not.toThrow()
    expect(readPendingApplies(null)).toEqual([])
    expect(nextApplyToConfirm(NOW, null)).toBeNull()
    expect(() => clearPendingApply('job-1', null)).not.toThrow()
  })

  it('degrades quietly when setItem throws, e.g. quota exceeded', () => {
    const hostile: StorageLike = {
      getItem: () => '[]',
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(() => recordPendingApply(entry(), hostile)).not.toThrow()
  })
})
