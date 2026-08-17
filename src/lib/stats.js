import { DEFAULT_ELO, applySetToRatings } from './schedule.js'
import { formatNightWhen, playerName } from './nights.js'

export const DUO_MIN_SETS = 3

function didWin(set, playerId) {
  if (set.team_a.includes(playerId)) return set.score_a > set.score_b
  if (set.team_b.includes(playerId)) return set.score_b > set.score_a
  return null
}

function allPlayerIds(sets) {
  const ids = new Set()
  sets.forEach((set) => {
    set.team_a.forEach((id) => ids.add(id))
    set.team_b.forEach((id) => ids.add(id))
  })
  return [...ids]
}

// Trailing run only — the most recent result and how many sets in a row it
// repeats, e.g. a W L W W tail is a 2-set win streak, not the whole history.
function trailingStreak(results) {
  if (results.length === 0) return { type: null, count: 0 }
  const type = results[results.length - 1]
  let count = 0
  for (let i = results.length - 1; i >= 0 && results[i] === type; i--) count++
  return { type, count }
}

// Ranking is always replayed from the full set log, never denormalized, so
// delete+relog of any set is trivially correct — same discipline as computeRatings.
// playerIds seeds the ranking with the full roster, including players who
// haven't logged a set yet (shown at the default rating, 0-0, no streak).
export function computeRankings(sets, playerIds = []) {
  const ratings = {}
  const wins = {}
  const losses = {}
  const results = {}
  const lastDelta = {}

  sets.forEach((set) => {
    const before = { ...ratings }
    const after = applySetToRatings(ratings, set)
    ;[...set.team_a, ...set.team_b].forEach((id) => {
      const won = didWin(set, id)
      wins[id] = (wins[id] ?? 0) + (won ? 1 : 0)
      losses[id] = (losses[id] ?? 0) + (won ? 0 : 1)
      results[id] = [...(results[id] ?? []), won ? 'W' : 'L']
      lastDelta[id] = after[id] - (before[id] ?? DEFAULT_ELO)
      ratings[id] = after[id]
    })
  })

  const ids = new Set(playerIds)
  allPlayerIds(sets).forEach((id) => ids.add(id))

  return [...ids]
    .map((id) => ({
      playerId: id,
      rating: Math.round(ratings[id] ?? DEFAULT_ELO),
      wins: wins[id] ?? 0,
      losses: losses[id] ?? 0,
      delta: Math.round(lastDelta[id] ?? 0),
      streak: trailingStreak(results[id] ?? []),
    }))
    .sort((a, b) => b.rating - a.rating)
}

export function headToHead(sets, playerA, playerB) {
  const faceOffs = sets.filter((set) => {
    const aInA = set.team_a.includes(playerA)
    const aInB = set.team_b.includes(playerA)
    const bInA = set.team_a.includes(playerB)
    const bInB = set.team_b.includes(playerB)
    return (aInA && bInB) || (aInB && bInA)
  })
  return faceOffs.reduce(
    (acc, set) => (didWin(set, playerA) ? { ...acc, winsA: acc.winsA + 1 } : { ...acc, winsB: acc.winsB + 1 }),
    { sets: faceOffs.length, winsA: 0, winsB: 0 },
  )
}

function pairKey(a, b) {
  return [a, b].sort().join('|')
}

export function bestDuos(sets, minSets = DUO_MIN_SETS) {
  const byPair = new Map()
  sets.forEach((set) => {
    ;[
      { team: set.team_a, won: set.score_a > set.score_b },
      { team: set.team_b, won: set.score_b > set.score_a },
    ].forEach(({ team, won }) => {
      const [a, b] = [...team].sort()
      const key = pairKey(a, b)
      const entry = byPair.get(key) ?? { a, b, wins: 0, total: 0 }
      entry.total += 1
      if (won) entry.wins += 1
      byPair.set(key, entry)
    })
  })
  return [...byPair.values()]
    .filter((entry) => entry.total >= minSets)
    .map((entry) => ({ ...entry, winPct: Math.round((entry.wins / entry.total) * 100) }))
    .sort((a, b) => b.winPct - a.winPct)
}

export function buildTickerItems(rankings, players, nextNight) {
  const items = []
  items.push(
    nextNight
      ? `NEXT GAME ${formatNightWhen(nextNight.starts_at, nextNight.ends_at)}`
      : 'NO GAME PLANNED — BOOK ONE IN MATCHES',
  )
  rankings
    .filter((r) => r.streak.count >= 2)
    .forEach((r) => {
      const kind = r.streak.type === 'W' ? 'WIN' : 'LOSS'
      items.push(`${playerName(players, r.playerId).toUpperCase()} ON A ${r.streak.count}-${kind} STREAK`)
    })
  return items
}
