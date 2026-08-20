export const ACCENT_PALETTE = [
  '#ffb03a', '#ff4d8d', '#7fd4e8', '#0f7f74',
  '#b18ad1', '#ffe9cf', '#ffd23a', '#8a5ad8',
]

export const SPECIES = [
  { key: 'human', label: 'Human' },
  { key: 'bear', label: 'Bear' },
  { key: 'penguin', label: 'Penguin' },
  { key: 'bird', label: 'Bird' },
  { key: 'panda', label: 'Panda' },
  { key: 'wolf', label: 'Wolf' },
]

const SPECIES_KEYS = new Set(SPECIES.map((s) => s.key))

export function isValidSpecies(key) {
  return SPECIES_KEYS.has(key)
}

export function isValidAccent(hex) {
  return ACCENT_PALETTE.includes(hex)
}

const DARK = '#140a20'

const FIXED_ART = {
  bear: [
    { x: 0, y: 0, w: 2, h: 1, fill: '#5a3418' },
    { x: 6, y: 0, w: 2, h: 1, fill: '#5a3418' },
    { x: 2, y: 0, w: 4, h: 1, fill: '#8a5a34' },
    { x: 1, y: 1, w: 6, h: 1, fill: '#8a5a34' },
    { x: 1, y: 2, w: 6, h: 4, fill: '#e0b88a' },
    { x: 2, y: 3, w: 1, h: 1, fill: DARK },
    { x: 5, y: 3, w: 1, h: 1, fill: DARK },
    { x: 3, y: 5, w: 2, h: 1, fill: '#5a3418' },
  ],
  penguin: [
    { x: 0, y: 0, w: 8, h: 2, fill: '#181818' },
    { x: 0, y: 2, w: 2, h: 3, fill: '#181818' },
    { x: 6, y: 2, w: 2, h: 3, fill: '#181818' },
    { x: 2, y: 2, w: 4, h: 3, fill: '#f4f4f4' },
    { x: 2, y: 2, w: 1, h: 1, fill: DARK },
    { x: 5, y: 2, w: 1, h: 1, fill: DARK },
    { x: 3, y: 4, w: 2, h: 1, fill: '#ff8a2a' },
    { x: 1, y: 5, w: 6, h: 1, fill: '#181818' },
  ],
  bird: [
    { x: 2, y: 0, w: 4, h: 1, fill: '#7fd4e8' },
    { x: 0, y: 1, w: 8, h: 1, fill: '#4fb8d8' },
    { x: 1, y: 2, w: 6, h: 3, fill: '#7fd4e8' },
    { x: 2, y: 2, w: 1, h: 1, fill: DARK },
    { x: 6, y: 3, w: 2, h: 1, fill: '#ff8a2a' },
    { x: 1, y: 5, w: 6, h: 1, fill: '#4fb8d8' },
  ],
  panda: [
    { x: 0, y: 0, w: 2, h: 1, fill: '#181818' },
    { x: 6, y: 0, w: 2, h: 1, fill: '#181818' },
    { x: 2, y: 0, w: 4, h: 1, fill: '#f4f4f4' },
    { x: 0, y: 1, w: 8, h: 1, fill: '#f4f4f4' },
    { x: 1, y: 2, w: 6, h: 4, fill: '#f4f4f4' },
    { x: 1, y: 2, w: 2, h: 2, fill: '#181818' },
    { x: 5, y: 2, w: 2, h: 2, fill: '#181818' },
    { x: 3, y: 5, w: 2, h: 1, fill: '#181818' },
  ],
  wolf: [
    { x: 1, y: 0, w: 1, h: 1, fill: '#4a5568' },
    { x: 6, y: 0, w: 1, h: 1, fill: '#4a5568' },
    { x: 1, y: 1, w: 6, h: 1, fill: '#6b7a90' },
    { x: 1, y: 2, w: 6, h: 3, fill: '#8d9cb0' },
    { x: 2, y: 2, w: 1, h: 1, fill: DARK },
    { x: 5, y: 2, w: 1, h: 1, fill: DARK },
    { x: 2, y: 4, w: 4, h: 2, fill: '#e6ecf5' },
    { x: 3, y: 5, w: 2, h: 1, fill: DARK },
  ],
}

export function speciesArt(species, player) {
  if (species === 'human' || !FIXED_ART[species]) {
    return [
      { x: 0, y: 0, w: 8, h: 2, fill: player.hair },
      { x: 1, y: 2, w: 6, h: 4, fill: player.skin },
      { x: 2, y: 3, w: 1, h: 1, fill: DARK },
      { x: 5, y: 3, w: 1, h: 1, fill: DARK },
      { x: 3, y: 5, w: 2, h: 1, fill: '#a05a3c' },
    ]
  }
  return FIXED_ART[species]
}
