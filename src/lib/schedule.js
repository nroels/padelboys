export const SCHEDULE_SET_COUNT = 3
export const DEFAULT_ELO = 1000
export const ELO_K = 32

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

export function isValidScore(scoreA, scoreB) {
  return (
    Number.isInteger(scoreA) &&
    Number.isInteger(scoreB) &&
    scoreA >= 0 &&
    scoreA <= 7 &&
    scoreB >= 0 &&
    scoreB <= 7 &&
    scoreA !== scoreB
  )
}

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400))
}

// Team rating = average of its players; each player's rating moves by the
// same delta as their team, based on the team-average expected score.
export function applySetToRatings(ratings, set) {
  const ratingA = teamRating(ratings, set.team_a) / set.team_a.length
  const ratingB = teamRating(ratings, set.team_b) / set.team_b.length
  const expectedA = expectedScore(ratingA, ratingB)
  const actualA = set.score_a > set.score_b ? 1 : 0
  const next = { ...ratings }
  set.team_a.forEach((id) => {
    next[id] = (ratings[id] ?? DEFAULT_ELO) + ELO_K * (actualA - expectedA)
  })
  set.team_b.forEach((id) => {
    next[id] = (ratings[id] ?? DEFAULT_ELO) + ELO_K * ((1 - actualA) - (1 - expectedA))
  })
  return next
}

// Ratings are never stored — always replayed from the full set log in order,
// so delete+relog of a set is trivially correct.
export function computeRatings(sets) {
  return sets.reduce((ratings, set) => applySetToRatings(ratings, set), {})
}
