export const SCHEDULE_SET_COUNT = 3
export const DEFAULT_ELO = 1000

function shuffle(items, rng) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateSchedule(playerIds, rng = Math.random) {
  if (playerIds.length !== 4) {
    throw new Error('a schedule requires exactly 4 players')
  }
  const [a, b, c, d] = shuffle(playerIds, rng)
  const splits = [
    { a: [a, b], b: [c, d] },
    { a: [a, c], b: [b, d] },
    { a: [a, d], b: [b, c] },
  ]
  return shuffle(splits, rng)
}

export function teamRating(ratings, teamIds) {
  return teamIds.reduce((sum, id) => sum + (ratings?.[id] ?? DEFAULT_ELO), 0)
}

export function fairnessPercent(ratings, teamA, teamB) {
  const diff = Math.abs(teamRating(ratings, teamA) - teamRating(ratings, teamB))
  return Math.max(60, Math.round(100 - diff / 4))
}

export function isScheduleLocked(setCount) {
  return setCount > 0
}
