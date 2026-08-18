import { describe, expect, it } from 'vitest'
import { ACCENT_PALETTE, SPECIES, isValidAccent, isValidSpecies, speciesArt } from './avatars.js'

describe('isValidSpecies', () => {
  it('accepts every listed species key', () => {
    for (const s of SPECIES) expect(isValidSpecies(s.key)).toBe(true)
  })

  it('rejects anything not in the list', () => {
    expect(isValidSpecies('dog')).toBe(false)
    expect(isValidSpecies('')).toBe(false)
    expect(isValidSpecies(undefined)).toBe(false)
  })
})

describe('isValidAccent', () => {
  it('accepts every palette color', () => {
    for (const c of ACCENT_PALETTE) expect(isValidAccent(c)).toBe(true)
  })

  it('rejects a color outside the fixed palette', () => {
    expect(isValidAccent('#123456')).toBe(false)
    expect(isValidAccent(undefined)).toBe(false)
  })
})

describe('speciesArt', () => {
  it('draws the human species from the player\'s own hair/skin, unchanged from before', () => {
    const player = { hair: '#3a2a1d', skin: '#e0a878' }
    const rects = speciesArt('human', player)
    expect(rects).toContainEqual({ x: 0, y: 0, w: 8, h: 2, fill: '#3a2a1d' })
    expect(rects).toContainEqual({ x: 1, y: 2, w: 6, h: 4, fill: '#e0a878' })
  })

  it('draws non-human species from fixed art, ignoring the player\'s hair/skin', () => {
    const player = { hair: '#3a2a1d', skin: '#e0a878' }
    const rects = speciesArt('bear', player)
    expect(rects.some((r) => r.fill === player.hair)).toBe(false)
    expect(rects.some((r) => r.fill === player.skin)).toBe(false)
    expect(rects.length).toBeGreaterThan(0)
  })

  it('produces distinct art for every species', () => {
    const player = { hair: '#000', skin: '#fff' }
    const all = SPECIES.map((s) => JSON.stringify(speciesArt(s.key, player)))
    expect(new Set(all).size).toBe(SPECIES.length)
  })
})
