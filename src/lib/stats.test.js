import { describe, expect, it } from 'vitest'
import { DEFAULT_ELO } from './schedule.js'
import { bestDuos, buildTickerItems, computeRankings, headToHead } from './stats.js'

const set = (team_a, team_b, score_a, score_b) => ({ team_a, team_b, score_a, score_b })

describe('computeRankings', () => {
  it('is deterministic and equivalent whether a set is deleted-and-relogged or never logged', () => {
    const sets = [set(['a', 'b'], ['c', 'd'], 6, 3), set(['a', 'c'], ['b', 'd'], 4, 6)]
    expect(computeRankings(sets)).toEqual(computeRankings(sets))

    const afterDelete = computeRankings([sets[0]])
    const afterRelog = computeRankings([sets[0], sets[1]])
    expect(afterDelete).not.toEqual(afterRelog)
    expect(computeRankings(sets.slice(0, 1))).toEqual(afterDelete)
  })

  it('replaying after deleting the last set and relogging a corrected score matches a log that never had the mistake', () => {
    const wrong = set(['a', 'c'], ['b', 'd'], 6, 4)
    const corrected = set(['a', 'c'], ['b', 'd'], 4, 6)
    const firstSet = set(['a', 'b'], ['c', 'd'], 6, 3)
    const relogged = [firstSet, corrected]
    expect(computeRankings([firstSet, wrong].slice(0, -1).concat(corrected))).toEqual(computeRankings(relogged))
    expect(computeRankings(relogged)).not.toEqual(computeRankings([firstSet, wrong]))
  })

  it('seeds the full roster, defaulting players with no sets logged', () => {
    const sets = [set(['a', 'b'], ['c', 'd'], 6, 3)]
    const rankings = computeRankings(sets, ['a', 'b', 'c', 'd', 'e'])
    const e = rankings.find((r) => r.playerId === 'e')
    expect(e).toMatchObject({ rating: DEFAULT_ELO, wins: 0, losses: 0, delta: 0, streak: { type: null, count: 0 } })
    expect(rankings).toHaveLength(5)
  })

  it('tracks W-L record and ranks by rating descending', () => {
    const sets = [set(['a', 'b'], ['c', 'd'], 6, 3), set(['a', 'b'], ['c', 'd'], 6, 2)]
    const rankings = computeRankings(sets)
    const byId = Object.fromEntries(rankings.map((r) => [r.playerId, r]))
    expect(byId.a.wins).toBe(2)
    expect(byId.a.losses).toBe(0)
    expect(byId.c.wins).toBe(0)
    expect(byId.c.losses).toBe(2)
    expect(rankings[0].rating).toBeGreaterThanOrEqual(rankings[rankings.length - 1].rating)
  })

  it('rating delta reflects only the most recent set played', () => {
    const sets = [set(['a', 'b'], ['c', 'd'], 6, 3), set(['a', 'b'], ['c', 'd'], 6, 2)]
    const rankings = computeRankings(sets)
    const a = rankings.find((r) => r.playerId === 'a')
    expect(a.delta).toBeGreaterThan(0)
    expect(a.rating - a.delta).not.toBe(DEFAULT_ELO)
  })

  it('handles an empty log', () => {
    expect(computeRankings([])).toEqual([])
  })

  it('gives a single-set player a streak of length 1', () => {
    const rankings = computeRankings([set(['a', 'b'], ['c', 'd'], 6, 3)])
    const a = rankings.find((r) => r.playerId === 'a')
    expect(a.streak).toEqual({ type: 'W', count: 1 })
  })

  it('takes only the trailing run for an alternating record', () => {
    const sets = [
      set(['a', 'b'], ['c', 'd'], 6, 3),
      set(['a', 'b'], ['c', 'd'], 2, 6),
      set(['a', 'b'], ['c', 'd'], 6, 4),
      set(['a', 'b'], ['c', 'd'], 6, 1),
    ]
    const a = computeRankings(sets).find((r) => r.playerId === 'a')
    expect(a.streak).toEqual({ type: 'W', count: 2 })
  })
})

describe('headToHead', () => {
  it('only counts sets where the two played on opposite teams', () => {
    const sets = [
      set(['a', 'b'], ['c', 'd'], 6, 3),
      set(['a', 'c'], ['b', 'd'], 6, 2),
      set(['a', 'd'], ['b', 'c'], 3, 6),
    ]
    expect(headToHead(sets, 'a', 'b')).toEqual({ sets: 2, winsA: 1, winsB: 1 })
  })

  it('is zero for players who never faced off', () => {
    expect(headToHead([set(['a', 'b'], ['c', 'd'], 6, 3)], 'a', 'x')).toEqual({ sets: 0, winsA: 0, winsB: 0 })
  })
})

describe('bestDuos', () => {
  it('hides pairs under the minimum sets together', () => {
    const sets = [set(['a', 'b'], ['c', 'd'], 6, 3), set(['a', 'b'], ['c', 'd'], 6, 2)]
    expect(bestDuos(sets)).toEqual([])
  })

  it('includes a pair once it reaches the threshold, with the right win%', () => {
    const sets = [
      set(['a', 'b'], ['c', 'd'], 6, 3),
      set(['a', 'b'], ['c', 'd'], 6, 2),
      set(['a', 'b'], ['c', 'd'], 2, 6),
    ]
    const duos = bestDuos(sets)
    expect(duos).toHaveLength(2)
    const ab = duos.find((d) => d.a === 'a' && d.b === 'b')
    expect(ab).toMatchObject({ total: 3, wins: 2, winPct: 67 })
  })

  it('respects a custom threshold', () => {
    const sets = [set(['a', 'b'], ['c', 'd'], 6, 3), set(['a', 'b'], ['c', 'd'], 6, 2)]
    expect(bestDuos(sets, 2)).toHaveLength(2)
  })
})

describe('buildTickerItems', () => {
  const players = [{ id: 'a', name: 'Nick' }]

  it('has no hardcoded content — reflects next-game and streak state', () => {
    const rankings = [{ playerId: 'a', rating: 1032, wins: 3, losses: 1, delta: 12, streak: { type: 'W', count: 3 } }]
    const items = buildTickerItems(rankings, players, null)
    expect(items).toContain('NO GAME PLANNED — BOOK ONE IN MATCHES')
    expect(items).toContain('NICK ON A 3-WIN STREAK')
  })

  it('omits streak callouts under 2 in a row', () => {
    const rankings = [{ playerId: 'a', rating: 1000, wins: 1, losses: 0, delta: 20, streak: { type: 'W', count: 1 } }]
    const items = buildTickerItems(rankings, players, null)
    expect(items.some((item) => item.includes('STREAK'))).toBe(false)
  })
})
