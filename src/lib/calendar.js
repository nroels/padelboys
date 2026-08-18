const DEFAULT_DURATION_MS = 90 * 60 * 1000

function toIcsUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcsText(text) {
  return text.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}

export function buildNightIcs(night, joinedNames = []) {
  const start = new Date(night.starts_at)
  const end = night.ends_at ? new Date(night.ends_at) : new Date(start.getTime() + DEFAULT_DURATION_MS)
  const description = joinedNames.length ? `Playing: ${joinedNames.join(', ')}` : ''

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PadelBoys//Night//EN',
    'BEGIN:VEVENT',
    `UID:night-${night.id}@padelboys`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    'SUMMARY:Padel Night',
    ...(description ? [`DESCRIPTION:${escapeIcsText(description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export function downloadNightIcs(night, joinedNames = []) {
  const ics = buildNightIcs(night, joinedNames)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `padel-night-${night.id}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
