import { describe, it, expect } from 'vitest'
import { growthInsight, viewerGrowthInsight, MIN_GROWTH_BASE } from './growth'
import type { InterestSlice } from './buckets'

const slice = (label: string, events: number): InterestSlice => ({
  label,
  events,
  visitors: Math.max(1, Math.round(events / 3)),
})

describe('growthInsight — which category the headline names', () => {
  it('names the category with the most interactions, not the biggest mover', () => {
    // graduate swung far harder, but casual is what students engage with most,
    // and the headline has to agree with the longest bar beside it.
    const current = [slice('casual', 1186), slice('graduate', 1059)]
    const previous = [slice('casual', 570), slice('graduate', 20)]

    const insight = growthInsight(current, previous, { subjectNoun: 'roles' })

    expect(insight.label).toBe('casual')
    expect(insight.changePct).toBe(108)
    expect(insight.sentence).toBe('108% growth in casual roles')
  })

  it('never names the "Other" fold, even when it is the largest bar', () => {
    // On the tag chart the folded tail routinely outweighs every real tag.
    // "growth in Other" would be meaningless.
    const current = [slice('Other', 5202), slice('Brand campaign', 2103)]
    const previous = [slice('Other', 2000), slice('Brand campaign', 1000)]

    expect(growthInsight(current, previous).label).toBe('Brand campaign')
  })

  it('ignores categories with no interactions at all', () => {
    const current = [slice('empty', 0), slice('real', 40)]
    const previous = [slice('real', 20)]

    expect(growthInsight(current, previous).label).toBe('real')
  })

  it('breaks ties alphabetically so the headline does not flicker', () => {
    const current = [slice('zeta', 200), slice('alpha', 200)]
    const previous = [slice('alpha', 100), slice('zeta', 100)]

    expect(growthInsight(current, previous).label).toBe('alpha')
    expect(growthInsight([...current].reverse(), previous).label).toBe('alpha')
  })
})

describe('growthInsight — the movement it reports', () => {
  it('reports growth for the leader', () => {
    const insight = growthInsight([slice('casual', 300)], [slice('casual', 150)], {
      subjectNoun: 'roles',
    })

    expect(insight.direction).toBe('up')
    expect(insight.sentence).toBe('100% growth in casual roles')
  })

  it('reports a decline as a drop', () => {
    const insight = growthInsight([slice('casual', 200)], [slice('casual', 400)], {
      subjectNoun: 'roles',
    })

    expect(insight.direction).toBe('down')
    expect(insight.changePct).toBe(-50)
    expect(insight.sentence).toBe('50% drop in casual roles')
  })

  it('reports an unchanged leader as steady rather than 0% growth', () => {
    const insight = growthInsight([slice('casual', 300)], [slice('casual', 300)], {
      subjectNoun: 'roles',
    })

    expect(insight.direction).toBe('flat')
    expect(insight.sentence).toBe('casual roles holding steady')
  })

  it('omits the noun for dimensions whose label already reads as one', () => {
    expect(growthInsight([slice('SEO', 300)], [slice('SEO', 200)]).sentence).toBe(
      '50% growth in SEO'
    )
  })
})

describe('growthInsight — refusing to invent a trend', () => {
  it('names the leader without a percentage when history predates the window', () => {
    // The exact quarterly case from the dashboard: a real leader, but the
    // comparison window starts before any event was ever recorded, so the
    // near-empty base would otherwise yield "+5167% growth".
    const current = [slice('casual', 1738)]
    const previous = [slice('casual', 33)]

    const insight = growthInsight(current, previous, {
      subjectNoun: 'roles',
      historyCoversPreviousWindow: false,
    })

    expect(insight.label).toBe('casual')
    expect(insight.changePct).toBeNull()
    expect(insight.direction).toBe('insufficient')
    expect(insight.sentence).toBe('casual roles leading')
  })

  it('still reports growth when history does cover the window', () => {
    const insight = growthInsight([slice('casual', 1186)], [slice('casual', 570)], {
      subjectNoun: 'roles',
      historyCoversPreviousWindow: true,
    })

    expect(insight.changePct).toBe(108)
  })

  it('assumes coverage when the caller does not say otherwise', () => {
    expect(growthInsight([slice('a', 200)], [slice('a', 100)]).changePct).toBe(100)
  })

  it('names the leader without a percentage when its prior base is below the floor', () => {
    const current = [slice('spike', 400)]
    const previous = [slice('spike', MIN_GROWTH_BASE - 1)]

    const insight = growthInsight(current, previous)

    expect(insight.label).toBe('spike')
    expect(insight.changePct).toBeNull()
  })

  it('treats a prior base exactly at the floor as comparable', () => {
    const insight = growthInsight(
      [slice('edge', MIN_GROWTH_BASE * 2)],
      [slice('edge', MIN_GROWTH_BASE)]
    )
    expect(insight.changePct).toBe(100)
  })

  it('does not divide by zero for a leader absent from the previous window', () => {
    const insight = growthInsight([slice('brand new', 900)], [slice('other', 500)])

    expect(insight.label).toBe('brand new')
    expect(insight.changePct).toBeNull()
    expect(insight.sentence).toBe('brand new leading')
  })

  it('handles null and empty input', () => {
    for (const input of [null, undefined, []]) {
      const insight = growthInsight(input, [slice('a', 100)])
      expect(insight.label).toBeNull()
      expect(insight.sentence).toBe('Not enough data yet')
    }
    expect(growthInsight([slice('a', 100)], null).label).toBe('a')
  })
})

describe('viewerGrowthInsight', () => {
  const bucket = (label: string, viewers: number) => ({ label, viewers })

  it('compares the last two complete buckets, skipping the partial current one', () => {
    // August is mid-month and artificially low. Comparing it would report a
    // collapse that has not happened; July vs June is the honest read.
    const buckets = [
      bucket('May 2026', 100),
      bucket('June 2026', 200),
      bucket('July 2026', 260),
      bucket('August 2026', 12),
    ]

    const insight = viewerGrowthInsight(buckets)

    expect(insight.label).toBe('July 2026')
    expect(insight.changePct).toBe(30)
    expect(insight.sentence).toBe('30% growth in viewers, July 2026')
  })

  it('reports a genuine decline', () => {
    const buckets = [
      bucket('May 2026', 100),
      bucket('June 2026', 200),
      bucket('July 2026', 150),
      bucket('August 2026', 9),
    ]

    expect(viewerGrowthInsight(buckets).sentence).toBe('25% drop in viewers, July 2026')
  })

  it('needs at least three buckets to have a comparison at all', () => {
    expect(viewerGrowthInsight([bucket('a', 10), bucket('b', 20)]).direction).toBe(
      'insufficient'
    )
    expect(viewerGrowthInsight([]).direction).toBe('insufficient')
  })

  it('refuses to compare against a prior bucket below the noise floor', () => {
    const buckets = [bucket('a', 1), bucket('b', 2), bucket('c', 40), bucket('d', 5)]
    expect(viewerGrowthInsight(buckets).direction).toBe('insufficient')
  })
})
