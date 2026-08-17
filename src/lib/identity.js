const PLAYER_ID_KEY = 'padelboys.playerId'
const ONBOARDED_KEY = 'padelboys.onboarded'

export function sanitizeUsername(input) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export function getStoredPlayerId() {
  return localStorage.getItem(PLAYER_ID_KEY)
}

export function setStoredPlayerId(id) {
  localStorage.setItem(PLAYER_ID_KEY, id)
}

export function clearStoredPlayerId() {
  localStorage.removeItem(PLAYER_ID_KEY)
}

export function hasSeenOnboarding() {
  return localStorage.getItem(ONBOARDED_KEY) === '1'
}

export function markOnboardingSeen() {
  localStorage.setItem(ONBOARDED_KEY, '1')
}
