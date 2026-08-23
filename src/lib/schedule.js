export const MIN_NIGHT_PLAYERS = 4
export const MAX_NIGHT_PLAYERS = 6
export const DEFAULT_ELO = 1000
export const ELO_K = 32
export const NIGHT_K_BUDGET = 96

// One cycle is the complete rotation for a group size: every player partners
// every other exactly once and the bench is shared equally. Entries are seat
// indices — generateSchedule shuffles real players into the seats.
const CYCLES = {
  // Nobody sits. The three distinct 2v2 splits of four players.
  4: [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ],
  // Everyone sits exactly once, partners each of the other four once, and
  // faces each of them twice.
  5: [
    [[0, 3], [1, 2]],
    [[1, 4], [2, 3]],
    [[2, 0], [3, 4]],
    [[3, 1], [4, 0]],
    [[4, 2], [0, 1]],
  ],
  // Everyone sits exactly twice. Fifteen pairs can't split evenly two-per-round,
  // so one cycle reaches twelve of them and misses seat pairs 0-3, 1-4 and 2-5.
  // reseat() shifts which three the next cycle misses, so a full night covers all.
  6: [
    [[0, 1], [2, 3]],
    [[0, 2], [4, 5]],
    [[0, 4], [1, 3]],
    [[0, 5], [2, 4]],
    [[1, 2], [3, 5]],
    [[1, 5], [3, 4]],
  ],
}

// How many times a night runs its cycle. More cycles means shorter rounds and
// more swapping — the bench is the same share of the night either way, just
// sliced thinner. Five players sit three short times rather than one long one.
const CYCLES_PER_NIGHT = { 4: 1, 5: 3, 6: 2 }

export function isPlayableGroup(playerCount) {
  return playerCount >= MIN_NIGHT_PLAYERS && playerCount <= MAX_NIGHT_PLAYERS
}

// Rounds per night, e.g. 3 for four players, 15 for five, 12 for six.
export function roundCountFor(playerCount) {
  if (!isPlayableGroup(playerCount)) return 0
  return CYCLES[playerCount].length * CYCLES_PER_NIGHT[playerCount]
}

// Rounds each individual plays; the rest of the night they're on the bench.
export function roundsPlayedPerPlayer(playerCount, roundCount = roundCountFor(playerCount)) {
  if (!playerCount) return 0
  return (roundCount * 4) / playerCount
}

function shuffle(items, rng) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// New seating for the next cycle, so the same people don't keep sitting out in
// the same rounds. Four and five-player cycles already cover every pair, so any
// reshuffle will do. A six-player cycle can only reach twelve of the fifteen
// pairs — it always misses the three seat pairs 0-3, 1-4 and 2-5 — so instead of
// reshuffling, rotate those three seats: the second cycle then misses a
// completely different three, and the night covers all fifteen.
function reseat(seats, rng) {
  if (seats.length !== 6) return shuffle(seats, rng)
  const [p0, p1, p2, p3, p4, p5] = seats
  return [p0, p1, p2, p4, p5, p3]
}

export function generateSchedule(playerIds, rng = Math.random) {
  const playerCount = playerIds.length
  if (!isPlayableGroup(playerCount)) {
    throw new Error(`a schedule requires ${MIN_NIGHT_PLAYERS}-${MAX_NIGHT_PLAYERS} players`)
  }
  const cycle = CYCLES[playerCount]
  const rounds = []
  let seats = shuffle(playerIds, rng)
  for (let c = 0; c < CYCLES_PER_NIGHT[playerCount]; c++) {
    if (c > 0) seats = reseat(seats, rng)
    shuffle(cycle, rng).forEach(([first, second]) => {
      const [a, b] = rng() < 0.5 ? [first, second] : [second, first]
      const onCourt = new Set([...a, ...b])
      rounds.push({
        a: a.map((seat) => seats[seat]),
        b: b.map((seat) => seats[seat]),
        out: seats.filter((_, seat) => !onCourt.has(seat)),
      })
    })
  }
  return rounds
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

// Rounds get shorter as the group grows — a four-player night is 3 full sets,
// a five-player night is 15 short ones — so a flat K would make one night worth
// five times another. Instead every player swings the same budget per night,
// split across the rounds they actually played:
//   K = 96 / (rounds x 4 / players) = 24 x players / rounds
// A 4-player, 3-round night lands back on exactly ELO_K, so nothing that has
// already been logged in the old format shifts.
export function nightKFactor(playerCount, roundCount) {
  if (!playerCount || !roundCount) return ELO_K
  return (NIGHT_K_BUDGET * playerCount) / (4 * roundCount)
}

// Sets carry their night_id. Anything without one — a hand-built set in a test,
// or a row from before nights were tracked — falls back to the flat K.
export function kFactorsByNight(sets) {
  const nights = new Map()
  sets.forEach((set) => {
    if (set.night_id == null) return
    const entry = nights.get(set.night_id) ?? { rounds: 0, players: new Set() }
    entry.rounds += 1
    ;[...set.team_a, ...set.team_b].forEach((id) => entry.players.add(id))
    nights.set(set.night_id, entry)
  })
  const factors = new Map()
  nights.forEach((entry, nightId) => {
    factors.set(nightId, nightKFactor(entry.players.size, entry.rounds))
  })
  return factors
}

export function kFactorForSet(set, factors) {
  return factors.get(set?.night_id) ?? ELO_K
}

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400))
}

// Team rating = average of its players; each player's rating moves by the
// same delta as their team, based on the team-average expected score.
export function applySetToRatings(ratings, set, k = ELO_K) {
  const ratingA = teamRating(ratings, set.team_a) / set.team_a.length
  const ratingB = teamRating(ratings, set.team_b) / set.team_b.length
  const expectedA = expectedScore(ratingA, ratingB)
  const actualA = set.score_a > set.score_b ? 1 : 0
  const next = { ...ratings }
  set.team_a.forEach((id) => {
    next[id] = (ratings[id] ?? DEFAULT_ELO) + k * (actualA - expectedA)
  })
  set.team_b.forEach((id) => {
    next[id] = (ratings[id] ?? DEFAULT_ELO) + k * ((1 - actualA) - (1 - expectedA))
  })
  return next
}

// Ratings are never stored — always replayed from the full set log in order,
// so delete+relog of a set is trivially correct. The per-night K is derived
// from the same log, so an abandoned night is simply scored as the shorter
// night it turned out to be.
export function computeRatings(sets) {
  const factors = kFactorsByNight(sets)
  return sets.reduce((ratings, set) => applySetToRatings(ratings, set, kFactorForSet(set, factors)), {})
}
