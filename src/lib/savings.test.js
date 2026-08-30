import { describe, expect, it } from 'vitest'
import {
  LEVEL_STEP,
  SAVINGS_PER_HOUR,
  computePrizePool,
  isBanked,
  levelFor,
  nightHours,
  nightSavings,
} from './savings.js'

function night({
  starts = '2026-08-25T18:00:00Z',
  ends = '2026-08-25T19:30:00Z',
  cronos = true,
  status = 'finished',
  sets = [{ id: 's1' }],
} = {}) {
  return { starts_at: starts, ends_at: ends, at_cronos: cronos, status, sets }
}

describe('nightHours', () => {
  it('measures the booked slot in hours', () => {
    expect(nightHours(night())).toBe(1.5)
    expect(nightHours(night({ ends: '2026-08-25T20:00:00Z' }))).toBe(2)
  })

  it('is zero for a night with no end time', () => {
    expect(nightHours(night({ ends: null }))).toBe(0)
  })

  it('is zero rather than negative when the end precedes the start', () => {
    expect(nightHours(night({ ends: '2026-08-25T17:00:00Z' }))).toBe(0)
  })
})

describe('nightSavings', () => {
  it('prices a Cronos night at the hourly saving', () => {
    expect(nightSavings(night())).toBe(1.5 * SAVINGS_PER_HOUR)
  })

  it('banks nothing for a night booked elsewhere', () => {
    expect(nightSavings(night({ cronos: false }))).toBe(0)
  })

  it('banks nothing for a Cronos night with no end time', () => {
    expect(nightSavings(night({ ends: null }))).toBe(0)
  })

  it('rounds an odd slot to whole euros', () => {
    expect(nightSavings(night({ ends: '2026-08-25T19:10:00Z' }))).toBe(23)
  })
})

describe('levelFor', () => {
  it('starts at level 1 and clears a level every step', () => {
    expect(levelFor(0)).toBe(1)
    expect(levelFor(LEVEL_STEP - 1)).toBe(1)
    expect(levelFor(LEVEL_STEP)).toBe(2)
    expect(levelFor(LEVEL_STEP * 3)).toBe(4)
  })
})

describe('isBanked', () => {
  it('banks a finished night that has scores', () => {
    expect(isBanked(night())).toBe(true)
  })

  it('does not bank a night that is still upcoming', () => {
    expect(isBanked(night({ status: 'upcoming' }))).toBe(false)
  })

  it('does not bank a finished night whose sets were all deleted', () => {
    expect(isBanked(night({ sets: [] }))).toBe(false)
  })
})

describe('computePrizePool', () => {
  it('banks only finished nights, so an upcoming one is not counted yet', () => {
    const pool = computePrizePool([night(), night({ status: 'upcoming' })])
    expect(pool.banked).toBe(30)
  })

  it('ignores a finished night with no scores logged', () => {
    const pool = computePrizePool([night(), night({ sets: [] })])
    expect(pool.banked).toBe(30)
  })

  it('skips nights booked elsewhere but still totals the rest', () => {
    const pool = computePrizePool([night(), night({ cronos: false }), night()])
    expect(pool.banked).toBe(60)
  })

  it('banks nothing for a Cronos night with no end time', () => {
    expect(computePrizePool([night({ ends: null })]).banked).toBe(0)
  })

  it('reports progress through the current level', () => {
    const pool = computePrizePool([night({ ends: '2026-08-25T23:30:00Z' })]) // 5.5h = 110
    expect(pool.banked).toBe(110)
    expect(pool.level).toBe(2)
    expect(pool.intoLevel).toBe(10)
    expect(pool.toNextLevel).toBe(90)
    expect(pool.filledSegments).toBe(1)
  })

  it('fills no segment of a freshly cleared level', () => {
    const pool = computePrizePool([night({ ends: '2026-08-25T23:00:00Z' })]) // 5h = 100
    expect(pool.level).toBe(2)
    expect(pool.intoLevel).toBe(0)
    expect(pool.toNextLevel).toBe(LEVEL_STEP)
    expect(pool.filledSegments).toBe(0)
  })

  it('is empty with no nights at all', () => {
    expect(computePrizePool([])).toMatchObject({ banked: 0, level: 1 })
  })
})
