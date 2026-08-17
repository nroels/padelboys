// Mirrors src/lib/nights.js#formatNightWhen so push copy matches the app's
// own "WEEKDAY DD MON · HH:MM" style, in the group's home timezone.
const TIME_ZONE = 'Europe/Brussels'

export function formatNightWhen(startsAt: string): string {
  const date = new Date(startsAt)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const weekday = get('weekday').toUpperCase()
  const day = get('day')
  const month = get('month').toUpperCase()
  const hour = get('hour')
  const minute = get('minute')
  return `${weekday} ${day} ${month} · ${hour}:${minute}`
}

export function isTodayInBrussels(startsAt: string, now: Date): boolean {
  const dayOf = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(d)
  return dayOf(new Date(startsAt)) === dayOf(now)
}
