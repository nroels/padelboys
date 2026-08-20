import { describe, expect, it } from 'vitest'
import { SPECIES, avatarFromSpecies, speciesArt } from './avatars.js'
import {
  CELL_COUNT,
  CODE_ALPHABET,
  PALETTE,
  PALETTE_GROUPS,
  cellsToRects,
  decodeCells,
  encodeCells,
  hexToCode,
  isValidAvatar,
  nearestCode,
  rectsToCells,
} from './pixels.js'

// Every hair/skin value in the players table as of the migration. Kept here so
// a palette edit that would make an existing human avatar convert inexactly
// fails the suite instead of silently recolouring somebody.
const LIVE_PLAYER_COLORS = [
  '#3a2a1d', '#e8c84a', '#181818', '#8a3a1d', '#c8c8c8', '#5a3a8a', '#6a4a2a',
  '#e0a878', '#f0c8a0', '#c88a5a',
]

describe('palette', () => {
  it('has no duplicate colours', () => {
    expect(new Set(PALETTE).size).toBe(PALETTE.length)
  })

  it('fits inside the code alphabet', () => {
    expect(PALETTE.length).toBeLessThanOrEqual(CODE_ALPHABET.length)
  })

  // Stored strings are palette indices, so this order is a data format.
  // Appending is fine; changing any existing position corrupts saved avatars.
  it('keeps its existing order — append only, never reorder', () => {
    expect(PALETTE.slice(0, 40)).toEqual([
      '#140a20', '#181818', '#4a4a4a', '#8a8a8a', '#c8c8c8', '#f4f4f4', '#ffffff',
      '#ffe0bd', '#f0c8a0', '#e0a878', '#c88a5a', '#8d5524', '#5a3418',
      '#3a2a1d', '#6a4a2a', '#8a3a1d', '#8a5a34', '#8a5a2a', '#a06a34',
      '#6b4520', '#e0b88a', '#a05a3c', '#e8c84a', '#5a3a8a',
      '#4a5568', '#6b7a90', '#8d9cb0', '#e6ecf5',
      '#ff8a2a', '#ffb03a', '#ffd23a', '#ff4d8d', '#7fd4e8', '#4fb8d8',
      '#0f7f74', '#b18ad1', '#8a5ad8', '#ffe9cf', '#7fd44f', '#ff4d4d',
    ])
  })

  it('covers every group range without gaps or overlap', () => {
    const covered = PALETTE_GROUPS.flatMap((g) =>
      Array.from({ length: g.to - g.from + 1 }, (_, i) => g.from + i))
    expect(covered).toEqual(PALETTE.map((_, i) => i))
  })
})

describe('isValidAvatar', () => {
  it('accepts a full-length string of valid codes', () => {
    expect(isValidAvatar('.'.repeat(CELL_COUNT))).toBe(true)
    expect(isValidAvatar('0'.repeat(CELL_COUNT))).toBe(true)
  })

  it('rejects wrong length', () => {
    expect(isValidAvatar('0'.repeat(CELL_COUNT - 1))).toBe(false)
    expect(isValidAvatar('0'.repeat(CELL_COUNT + 1))).toBe(false)
  })

  it('rejects characters outside the alphabet', () => {
    expect(isValidAvatar('!'.repeat(CELL_COUNT))).toBe(false)
    expect(isValidAvatar('#'.repeat(CELL_COUNT))).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(isValidAvatar(null)).toBe(false)
    expect(isValidAvatar(undefined)).toBe(false)
    expect(isValidAvatar(48)).toBe(false)
  })
})

describe('encode / decode', () => {
  it('round-trips an arbitrary grid', () => {
    const cells = decodeCells('.'.repeat(CELL_COUNT))
    cells[0][0] = PALETTE[3]
    cells[5][7] = PALETTE[31]
    cells[2][4] = PALETTE[0]
    expect(decodeCells(encodeCells(cells))).toEqual(cells)
  })

  it('preserves transparency rather than filling it in', () => {
    const decoded = decodeCells('.'.repeat(CELL_COUNT))
    expect(decoded.flat().every((c) => c === null)).toBe(true)
  })

  it('produces exactly one character per cell', () => {
    expect(encodeCells(decodeCells('.'.repeat(CELL_COUNT))).length).toBe(CELL_COUNT)
  })

  it('decodes an invalid string to a blank grid instead of throwing', () => {
    expect(decodeCells('nope').flat().every((c) => c === null)).toBe(true)
  })
})

describe('cellsToRects', () => {
  it('merges cells back into pixel-identical rectangles', () => {
    for (const s of SPECIES) {
      const cells = rectsToCells(speciesArt(s.key, { hair: '#3a2a1d', skin: '#e0a878' }))
      expect(rectsToCells(cellsToRects(cells))).toEqual(cells)
    }
  })

  it('emits non-overlapping rectangles', () => {
    const cells = rectsToCells(speciesArt('bear', {}))
    const seen = new Set()
    for (const r of cellsToRects(cells)) {
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          expect(seen.has(`${x},${y}`)).toBe(false)
          seen.add(`${x},${y}`)
        }
      }
    }
  })
})

describe('backfill fidelity', () => {
  it('has an exact palette entry for every colour the fixed art uses', () => {
    const player = { hair: '#3a2a1d', skin: '#e0a878' }
    for (const s of SPECIES) {
      for (const rect of speciesArt(s.key, player)) {
        expect(hexToCode(rect.fill), `${s.key} uses ${rect.fill}`).not.toBeNull()
      }
    }
  })

  it('has an exact palette entry for every live player hair/skin colour', () => {
    for (const hex of LIVE_PLAYER_COLORS) {
      expect(hexToCode(hex), `${hex} missing from palette`).not.toBeNull()
    }
  })

  it('converts every species to an avatar string with no colour drift', () => {
    const player = { hair: '#6a4a2a', skin: '#f0c8a0' }
    for (const s of SPECIES) {
      const art = rectsToCells(speciesArt(s.key, player))
      const round = decodeCells(avatarFromSpecies(s.key, player))
      expect(round, `${s.key} drifted`).toEqual(art)
    }
  })

  it('gives every species a distinct avatar string', () => {
    const player = { hair: '#6a4a2a', skin: '#f0c8a0' }
    const all = SPECIES.map((s) => avatarFromSpecies(s.key, player))
    expect(new Set(all).size).toBe(SPECIES.length)
  })
})

describe('nearestCode', () => {
  it('returns the exact code when the colour is in the palette', () => {
    expect(nearestCode('#ff4d8d')).toBe(hexToCode('#ff4d8d'))
  })

  it('falls back to the closest palette entry for an unknown colour', () => {
    expect(nearestCode('#fe4d8e')).toBe(hexToCode('#ff4d8d'))
    expect(nearestCode('#000000')).toBe(hexToCode('#140a20'))
  })

  it('handles shorthand hex and garbage without throwing', () => {
    expect(nearestCode('#fff')).toBe(hexToCode('#ffffff'))
    expect(nearestCode('not-a-colour')).toBe(CODE_ALPHABET[0])
  })
})
