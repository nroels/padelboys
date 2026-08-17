export const NIGHT_CAP = 4
export const PLANNING_WINDOW_DAYS = 14
export const TIME_SLOTS = ['18:00', '19:00', '20:00']

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

export function formatNightWhen(isoOrDate) {
  const date = new Date(isoOrDate)
  const weekday = WEEKDAY[date.getDay()]
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTH[date.getMonth()]
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${weekday} ${day} ${month} · ${time}`
}

export function joinedPlayers(night, players) {
  return players.filter((p) => night.playerIds.has(p.id))
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
