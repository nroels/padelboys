// Cronos costs the group about €20 less per hour than any other club, so
// every hour booked there is money not spent. The prize pool is always
// replayed from the night log, never denormalized — same discipline as
// computeRankings, so editing or deleting a night can't leave a stale total.
export const SAVINGS_PER_HOUR = 20

// Pure arcade dressing: every €100 banked clears a level. No reward is
// attached in the app — what the pool buys is settled off-screen.
export const LEVEL_STEP = 100

const MS_PER_HOUR = 3600000
const BAR_SEGMENTS = 10

// Nights planned before ends_at existed have no duration to price, so they
// bank nothing rather than inventing an hour count. A night that somehow
// ends before it starts is treated the same way.
export function nightHours(night) {
  if (!night.ends_at) return 0
  const hours = (new Date(night.ends_at) - new Date(night.starts_at)) / MS_PER_HOUR
  return hours > 0 ? hours : 0
}

export function nightSavings(night) {
  if (!night.at_cronos) return 0
  return Math.round(nightHours(night) * SAVINGS_PER_HOUR)
}

export function levelFor(amount) {
  return Math.floor(amount / LEVEL_STEP) + 1
}

// A night only banks once it is finished AND has scores logged: an upcoming
// Cronos night is money the group is about to save (shown separately as this
// night's pending amount), and a night with no sets never really happened.
// The log wizard already refuses to finish a scoreless night, but deleting
// every set afterwards would otherwise leave the money banked, so the rule
// lives here rather than relying on that guard.
export function isBanked(night) {
  return night.status === 'finished' && (night.sets?.length ?? 0) > 0
}

export function computePrizePool(nights) {
  const played = nights.filter(isBanked)
  const banked = played.reduce((total, night) => total + nightSavings(night), 0)
  const intoLevel = banked % LEVEL_STEP

  return {
    banked,
    cronosNights: played.filter((night) => night.at_cronos).length,
    level: levelFor(banked),
    intoLevel,
    toNextLevel: LEVEL_STEP - intoLevel,
    // Rounded down so the bar only fills its last segment on an exact level-up.
    filledSegments: Math.floor((intoLevel / LEVEL_STEP) * BAR_SEGMENTS),
    totalSegments: BAR_SEGMENTS,
  }
}
