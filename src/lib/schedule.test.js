import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ELO,
  ELO_K,
  computeRatings,
  fairnessPercent,
  generateSchedule,
  isScheduleLocked,
  isValidScore,
  nightKFactor,
  roundCountFor,
  roundsPlayedPerPlayer,
} from './schedule.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

const ROSTER = ['a', 'b', 'c', 'd', 'e', 'f']

function pairKey(ids) {
  return [...ids].sort().join('')
}

function partnerCounts(schedule) {
  const counts = {}
  schedule.forEach((set) => {
    ;[set.a, set.b].forEach((team) => {
      counts[pairKey(team)] = (counts[pairKey(team)] ?? 0) + 1
    })
  })
  return counts
}

function benchCounts(schedule, ids) {
  const counts = Object.fromEntries(ids.map((id) => [id, 0]))
  schedule.forEach((set) => (set.out ?? []).forEach((id) => (counts[id] += 1)))
  return counts
}

describe('roundCountFor', () => {
  it('runs one cycle for four, three for five and two for six', () => {
    expect(roundCountFor(4)).toBe(3)
    expect(roundCountFor(5)).toBe(15)
    expect(roundCountFor(6)).toBe(12)
  })

  it('has no schedule for group sizes that cannot fill a court or exceed the roster', () => {
    expect(roundCountFor(3)).toBe(0)
    expect(roundCountFor(7)).toBe(0)
  })

  it('gives every player a whole number of rounds on court', () => {
    ;[4, 5, 6].forEach((n) => {
      expect(Number.isInteger(roundsPlayedPerPlayer(n))).toBe(true)
    })
    expect(roundsPlayedPerPlayer(4)).toBe(3)
    expect(roundsPlayedPerPlayer(5)).toBe(12)
    expect(roundsPlayedPerPlayer(6)).toBe(8)
  })
})

describe('generateSchedule', () => {
  it('produces the expected number of rounds for each group size', () => {
    ;[4, 5, 6].forEach((n) => {
      expect(generateSchedule(ROSTER.slice(0, n))).toHaveLength(roundCountFor(n))
    })
  })

  it('puts four distinct players on court and the rest on the bench every round', () => {
    ;[4, 5, 6].forEach((n) => {
      const ids = ROSTER.slice(0, n)
      generateSchedule(ids).forEach((set) => {
        const onCourt = [...set.a, ...set.b]
        expect(new Set(onCourt).size).toBe(4)
        expect([...onCourt, ...set.out].sort()).toEqual([...ids].sort())
      })
    })
  })

  it('shares the bench equally — nobody sits more often than anyone else', () => {
    ;[4, 5, 6].forEach((n) => {
      const ids = ROSTER.slice(0, n)
      const counts = Object.values(benchCounts(generateSchedule(ids), ids))
      expect(new Set(counts).size).toBe(1)
      expect(counts[0]).toBe(roundCountFor(n) - roundsPlayedPerPlayer(n))
    })
  })

  it('pairs four players into each distinct 2v2 split exactly once', () => {
    const counts = partnerCounts(generateSchedule(ROSTER.slice(0, 4)))
    expect(Object.keys(counts)).toHaveLength(6)
    expect(Object.values(counts).every((c) => c === 1)).toBe(true)
  })

  it('pairs every five-player duo the same number of times', () => {
    const counts = partnerCounts(generateSchedule(ROSTER.slice(0, 5)))
    expect(Object.keys(counts)).toHaveLength(10)
    expect(Object.values(counts).every((c) => c === 3)).toBe(true)
  })

  it('pairs all fifteen six-player duos at least once across the night', () => {
    // A single six-player cycle can only reach twelve pairs; the second cycle
    // is reseated to miss a different three, covering all fifteen.
    const counts = partnerCounts(generateSchedule(ROSTER))
    expect(Object.keys(counts)).toHaveLength(15)
    expect(Object.values(counts).every((c) => c === 1 || c === 2)).toBe(true)
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(roundCountFor(6) * 2)
  })

  it('never lets the same duo partner twice while another duo never partners', () => {
    ;[4, 5, 6].forEach((n) => {
      const counts = partnerCounts(generateSchedule(ROSTER.slice(0, n)))
      const spread = Math.max(...Object.values(counts)) - Math.min(...Object.values(counts))
      expect(spread).toBeLessThanOrEqual(1)
    })
  })

  it('throws for group sizes that cannot play', () => {
    expect(() => generateSchedule(['a', 'b', 'c'])).toThrow()
    expect(() => generateSchedule([...ROSTER, 'g'])).toThrow()
  })

  it('is deterministic given the same rng sequence', () => {
    const ids = ROSTER.slice(0, 5)
    expect(generateSchedule(ids, seededRng(42))).toEqual(generateSchedule(ids, seededRng(42)))
  })
})

describe('nightKFactor', () => {
  it('leaves a four-player, three-round night on the original flat K', () => {
    expect(nightKFactor(4, roundCountFor(4))).toBe(ELO_K)
  })

  it('gives every group size the same rating budget per night', () => {
    ;[4, 5, 6].forEach((n) => {
      const k = nightKFactor(n, roundCountFor(n))
      expect(k * roundsPlayedPerPlayer(n)).toBe(96)
    })
  })

  it('scores an abandoned night as the shorter night it turned out to be', () => {
    expect(nightKFactor(5, 5)).toBe(24)
    expect(nightKFactor(5, 15)).toBe(8)
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

describe('isValidScore', () => {
  it('accepts any unequal pair of scores within 0-7', () => {
    expect(isValidScore(6, 3)).toBe(true)
    expect(isValidScore(0, 7)).toBe(true)
  })

  it('rejects equal scores, out-of-range scores, and non-integers', () => {
    expect(isValidScore(6, 6)).toBe(false)
    expect(isValidScore(-1, 5)).toBe(false)
    expect(isValidScore(8, 5)).toBe(false)
    expect(isValidScore(6.5, 3)).toBe(false)
  })
})

describe('computeRatings', () => {
  const set = (team_a, team_b, score_a, score_b) => ({ team_a, team_b, score_a, score_b })

  it('is deterministic and moves winners up, losers down', () => {
    const sets = [set(['a', 'b'], ['c', 'd'], 6, 3), set(['a', 'c'], ['b', 'd'], 6, 2)]
    const ratings = computeRatings(sets)
    expect(computeRatings(sets)).toEqual(ratings)
    expect(ratings.a).toBeGreaterThan(DEFAULT_ELO)
    expect(ratings.d).toBeLessThan(DEFAULT_ELO)
  })

  it('is equivalent whether a set is deleted-and-relogged or never logged', () => {
    const sets = [set(['a', 'b'], ['c', 'd'], 6, 3), set(['a', 'c'], ['b', 'd'], 4, 6)]
    const relogged = [sets[0], sets[1]]
    expect(computeRatings(relogged)).toEqual(computeRatings(sets))

    const afterDelete = computeRatings([sets[0]])
    const afterRelog = computeRatings([sets[0], sets[1]])
    expect(afterDelete).not.toEqual(afterRelog)
    expect(computeRatings(sets.slice(0, 1))).toEqual(afterDelete)
  })
})
