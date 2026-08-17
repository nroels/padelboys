import { describe, expect, it } from 'vitest'
import {
  NIGHT_CAP,
  TIME_SLOTS,
  combineDateAndTime,
  formatNightWhen,
  isFull,
  joinedPlayers,
  soonestNight,
  spotsRemaining,
  upcomingDays,
} from './nights.js'

describe('upcomingDays', () => {
  it('returns 14 consecutive days starting from the given date', () => {
    const days = upcomingDays(new Date('2026-08-17T09:00:00'))
    expect(days).toHaveLength(14)
    expect(days[0].getDate()).toBe(17)
    expect(days[13].getDate()).toBe(30)
  })
})

describe('combineDateAndTime', () => {
  it('sets the time-of-day onto the given date', () => {
    const combined = combineDateAndTime(new Date('2026-08-20T00:00:00'), '20:00')
    expect(combined.getHours()).toBe(20)
    expect(combined.getMinutes()).toBe(0)
    expect(combined.getDate()).toBe(20)
  })
})

describe('formatNightWhen', () => {
  it('formats a date as WEEKDAY DD MON · HH:MM', () => {
    expect(formatNightWhen('2026-08-20T20:00:00')).toBe('THU 20 AUG · 20:00')
  })
})

describe('joinedPlayers', () => {
  it('returns the players whose id is in the night\'s joined set', () => {
    const night = { playerIds: new Set(['a', 'c']) }
    const players = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(joinedPlayers(night, players)).toEqual([{ id: 'a' }, { id: 'c' }])
  })
})

describe('isFull / spotsRemaining', () => {
  it('is full at the cap and not before it', () => {
    expect(isFull(NIGHT_CAP)).toBe(true)
    expect(isFull(NIGHT_CAP - 1)).toBe(false)
  })

  it('reports spots remaining down to zero, never negative', () => {
    expect(spotsRemaining(0)).toBe(NIGHT_CAP)
    expect(spotsRemaining(NIGHT_CAP - 1)).toBe(1)
    expect(spotsRemaining(NIGHT_CAP)).toBe(0)
  })
})

describe('soonestNight', () => {
  it('picks the earliest starts_at', () => {
    const nights = [
      { id: 'b', starts_at: '2026-08-24T10:00:00' },
      { id: 'a', starts_at: '2026-08-20T20:00:00' },
    ]
    expect(soonestNight(nights).id).toBe('a')
  })

  it('returns null for an empty list', () => {
    expect(soonestNight([])).toBe(null)
  })
})

describe('TIME_SLOTS', () => {
  it('offers a fixed set of evening slots', () => {
    expect(TIME_SLOTS).toEqual(['18:00', '19:00', '20:00'])
  })
})
