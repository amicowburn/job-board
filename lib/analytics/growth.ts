import type { InterestSlice } from './buckets'

/**
 * Headline movement for an interest dimension.
 *
 * The headline names the *top-performing* category — the one with the most
 * interactions in the current window — and reports how that category has moved
 * against the equal-length window before it. So the card answers two things at
 * once: what students are most interested in, and whether that interest is
 * rising or falling.
 */

export type GrowthDirection = 'up' | 'down' | 'flat' | 'insufficient'

export interface GrowthInsight {
  /** Top-performing category, or null when there is nothing to report. */
  label: string | null
  /** Its change against the previous window. Null when no honest comparison exists. */
  changePct: number | null
  direction: GrowthDirection
  /** Ready-to-render sentence. */
  sentence: string
}

/**
 * `topInterests` folds everything past the visible top N into this label. It is
 * an aggregate, not a category, so it can never be the headline — "growth in
 * Other" says nothing, and on the tag chart the fold is routinely the largest
 * bar on screen.
 */
const OTHER_LABEL = 'Other'

/**
 * Interactions a category needed in the previous window before a percentage is
 * worth printing at all.
 *
 * A backstop for genuinely tiny categories. The main protection against
 * nonsense percentages is the history check in `growthInsight` — see below.
 */
export const MIN_GROWTH_BASE = 20

const NOTHING: GrowthInsight = {
  label: null,
  changePct: null,
  direction: 'insufficient',
  sentence: 'Not enough data yet',
}

export interface GrowthOptions {
  /** Appended to the category name — "roles" gives "graduate roles". */
  subjectNoun?: string
  /**
   * Whether tracked history actually reaches back far enough to cover the
   * previous window.
   *
   * This matters more than it sounds. The comparison window is derived from the
   * granularity, so on the yearly view it can reach years before the first
   * event ever recorded. The database dutifully returns a near-empty previous
   * window, and dividing by that produces figures like "+5462% growth" — which
   * is not growth, it is the absence of history. When this is false the leader
   * is still named, but no percentage is claimed.
   */
  historyCoversPreviousWindow?: boolean
}

/**
 * The top-performing category and how it has moved.
 *
 * Selection is by current interaction volume, so the headline always agrees
 * with the longest bar on the chart beside it. Ties break alphabetically so the
 * headline does not flicker between equal candidates on re-render.
 */
export function growthInsight(
  current: InterestSlice[] | null | undefined,
  previous: InterestSlice[] | null | undefined,
  options: GrowthOptions = {}
): GrowthInsight {
  const { subjectNoun, historyCoversPreviousWindow = true } = options

  const ranked = (current ?? [])
    .filter((slice) => slice.label !== OTHER_LABEL && slice.events > 0)
    .sort((a, b) => b.events - a.events || a.label.localeCompare(b.label))

  const top = ranked[0]
  if (!top) return NOTHING

  const subject = subjectNoun ? `${top.label} ${subjectNoun}` : top.label
  const leaderOnly: GrowthInsight = {
    label: top.label,
    changePct: null,
    direction: 'insufficient',
    sentence: `${subject} leading`,
  }

  if (!historyCoversPreviousWindow) return leaderOnly

  const before = (previous ?? []).find((slice) => slice.label === top.label)?.events ?? 0
  if (before < MIN_GROWTH_BASE) return leaderOnly

  const changePct = Math.round(((top.events - before) / before) * 100)

  if (changePct === 0) {
    return {
      label: top.label,
      changePct: 0,
      direction: 'flat',
      sentence: `${subject} holding steady`,
    }
  }

  return {
    label: top.label,
    changePct,
    direction: changePct > 0 ? 'up' : 'down',
    sentence:
      changePct > 0
        ? `${changePct}% growth in ${subject}`
        : `${Math.abs(changePct)}% drop in ${subject}`,
  }
}

/**
 * Movement in total viewers between the two most recent complete buckets.
 *
 * The current bucket is deliberately skipped: on the 10th of a month it holds
 * ten days of data, and comparing that against a full previous month would
 * report a collapse that has not happened.
 */
export function viewerGrowthInsight(
  buckets: { label: string; viewers: number }[]
): GrowthInsight {
  if (buckets.length < 3) return NOTHING

  const latestComplete = buckets[buckets.length - 2]
  const priorComplete = buckets[buckets.length - 3]

  if (priorComplete.viewers < MIN_GROWTH_BASE) return NOTHING

  const changePct = Math.round(
    ((latestComplete.viewers - priorComplete.viewers) / priorComplete.viewers) * 100
  )

  if (changePct === 0) {
    return {
      label: latestComplete.label,
      changePct: 0,
      direction: 'flat',
      sentence: `Viewers steady in ${latestComplete.label}`,
    }
  }

  return {
    label: latestComplete.label,
    changePct,
    direction: changePct > 0 ? 'up' : 'down',
    sentence:
      changePct > 0
        ? `${changePct}% growth in viewers, ${latestComplete.label}`
        : `${Math.abs(changePct)}% drop in viewers, ${latestComplete.label}`,
  }
}
