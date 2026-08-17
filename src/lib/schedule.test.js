import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ELO,
  SCHEDULE_SET_COUNT,
  fairnessPercent,
  generateSchedule,
  isScheduleLocked,
} from './schedule.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

describe('generateSchedule', () => {
  it('produces one set per unique 2v2 split of the 4 players', () => {
    const schedule = generateSchedule(['a', 'b', 'c', 'd'])
    expect(schedule).toHaveLength(SCHEDULE_SET_COUNT)
    const splitKeys = schedule.map((set) => [[...set.a].sort(), [...set.b].sort()].map((t) => t.join('')).sort().join('|'))
    expect(new Set(splitKeys).size).toBe(3)
  })

  it('only uses the given players, all 4 appearing exactly once per set', () => {
    const ids = ['a', 'b', 'c', 'd']
    const schedule = generateSchedule(ids)
    schedule.forEach((set) => {
      expect([...set.a, ...set.b].sort()).toEqual([...ids].sort())
    })
  })

  it('throws unless given exactly 4 players', () => {
    expect(() => generateSchedule(['a', 'b', 'c'])).toThrow()
    expect(() => generateSchedule(['a', 'b', 'c', 'd', 'e'])).toThrow()
  })

  it('is deterministic given the same rng sequence', () => {
    const ids = ['a', 'b', 'c', 'd']
    const first = generateSchedule(ids, seededRng(42))
    const second = generateSchedule(ids, seededRng(42))
    expect(second).toEqual(first)
  })
})

describe('fairnessPercent', () => {
  it('is 100 when both teams have equal ratings', () => {
    expect(fairnessPercent({}, ['a', 'b'], ['c', 'd'])).toBe(100)
  })

  it('falls back to the default rating for unknown players', () => {
    const ratings = { a: DEFAULT_ELO, b: DEFAULT_ELO }
    expect(fairnessPercent(ratings, ['a', 'b'], ['c', 'd'])).toBe(100)
  })

  it('drops as the rating gap between teams grows, floored at 60', () => {
    const ratings = { a: 1400, b: 1400, c: 1000, d: 1000 }
    expect(fairnessPercent(ratings, ['a', 'b'], ['c', 'd'])).toBe(60)
  })
})

describe('isScheduleLocked', () => {
  it('is unlocked with no logged sets and locked once at least one is logged', () => {
    expect(isScheduleLocked(0)).toBe(false)
    expect(isScheduleLocked(1)).toBe(true)
    expect(isScheduleLocked(3)).toBe(true)
  })
})
