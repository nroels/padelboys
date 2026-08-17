export const NIGHT_CAP = 4
export const PLANNING_WINDOW_DAYS = 14

const WEEKDAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function upcomingDays(from = new Date()) {
  return Array.from({ length: PLANNING_WINDOW_DAYS }, (_, i) => {
    const date = new Date(from)
    date.setDate(date.getDate() + i)
    return date
  })
}

export function combineDateAndTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hours, minutes, 0, 0)
  return combined
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatNightWhen(isoOrDate, endIsoOrDate) {
  const date = new Date(isoOrDate)
  const weekday = WEEKDAY[date.getDay()]
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTH[date.getMonth()]
  const time = endIsoOrDate ? `${formatTime(date)}-${formatTime(new Date(endIsoOrDate))}` : formatTime(date)
  return `${weekday} ${day} ${month} · ${time}`
}

export function joinedPlayers(night, players) {
  return players.filter((p) => night.playerIds.has(p.id))
}

export function playerName(players, id) {
  return players.find((p) => p.id === id)?.name ?? '???'
}

export function isFull(joinedCount) {
  return joinedCount >= NIGHT_CAP
}

export function spotsRemaining(joinedCount) {
  return Math.max(0, NIGHT_CAP - joinedCount)
}

export function soonestNight(nights) {
  if (nights.length === 0) return null
  return nights.reduce((soonest, night) =>
    new Date(night.starts_at) < new Date(soonest.starts_at) ? night : soonest,
  )
}

// A night keeps status 'upcoming' until explicitly finished; once its date
// has passed it's "pending" — waiting for a scorekeeper in the log tab —
// rather than shown as a future night to plan around.
export function isPendingNight(night, now = new Date()) {
  return night.status !== 'finished' && new Date(night.starts_at) < now
}

export function isUpcomingNight(night, now = new Date()) {
  return night.status !== 'finished' && new Date(night.starts_at) >= now
}

// Delete + relog is restricted to whichever night — finished or still
// pending — is the most recently scheduled one with any sets logged, so an
// older night can't be rewritten once a newer one has scores.
export function mostRecentScoredNight(nights) {
  const scored = nights.filter((n) => n.sets.length > 0)
  if (scored.length === 0) return null
  return scored.reduce((latest, n) => (new Date(n.starts_at) > new Date(latest.starts_at) ? n : latest))
}

export function canDeleteSet(nightId, nights) {
  return mostRecentScoredNight(nights)?.id === nightId
}
