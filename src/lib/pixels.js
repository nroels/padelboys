// Player-drawn avatars: an 8x6 grid of palette indices stored as one 48-char
// string on players.avatar. Rows 6-7 stay reserved for the accent band that
// Avatar.jsx paints on top, which is why the grid is 6 rows and not 8.
//
// A cell is one character: '.' is transparent, anything else is an index into
// PALETTE via CODE_ALPHABET.
//
// PALETTE IS APPEND-ONLY. Indices are baked into every stored string, so
// reordering or removing an entry silently repaints avatars that are already
// out there. Add to the end, never edit in place — pixels.test.js locks the
// current order so this fails loudly rather than quietly.

export const GRID_W = 8
export const GRID_H = 6
export const CELL_COUNT = GRID_W * GRID_H
export const TRANSPARENT = '.'

export const CODE_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const PALETTE = [
  // 0-6 neutrals / outlines
  '#140a20', '#181818', '#4a4a4a', '#8a8a8a', '#c8c8c8', '#f4f4f4', '#ffffff',
  // 7-12 skin
  '#ffe0bd', '#f0c8a0', '#e0a878', '#c88a5a', '#8d5524', '#5a3418',
  // 13-23 hair / fur
  '#3a2a1d', '#6a4a2a', '#8a3a1d', '#8a5a34', '#8a5a2a', '#a06a34',
  '#6b4520', '#e0b88a', '#a05a3c', '#e8c84a', '#5a3a8a',
  // 24-27 cool greys
  '#4a5568', '#6b7a90', '#8d9cb0', '#e6ecf5',
  // 28-39 brights
  '#ff8a2a', '#ffb03a', '#ffd23a', '#ff4d8d', '#7fd4e8', '#4fb8d8',
  '#0f7f74', '#b18ad1', '#8a5ad8', '#ffe9cf', '#7fd44f', '#ff4d4d',
]

// Only for laying the swatches out in the editor; changing these is safe.
export const PALETTE_GROUPS = [
  { label: 'INK', from: 0, to: 6 },
  { label: 'SKIN', from: 7, to: 12 },
  { label: 'HAIR', from: 13, to: 23 },
  { label: 'GREY', from: 24, to: 27 },
  { label: 'BRIGHT', from: 28, to: 39 },
]

const CODE_BY_HEX = new Map(PALETTE.map((hex, i) => [hex, CODE_ALPHABET[i]]))
const HEX_BY_CODE = new Map(PALETTE.map((hex, i) => [CODE_ALPHABET[i], hex]))

export const AVATAR_PATTERN = `^[.${CODE_ALPHABET}]{${CELL_COUNT}}$`
const AVATAR_RE = new RegExp(AVATAR_PATTERN)

export function isValidAvatar(str) {
  return typeof str === 'string' && AVATAR_RE.test(str)
}

export function hexToCode(hex) {
  return CODE_BY_HEX.get(hex) ?? null
}

export function codeToHex(code) {
  return HEX_BY_CODE.get(code) ?? null
}

// Falls back to the closest palette entry so art using an off-palette colour
// (an old per-player hair value, say) still converts instead of throwing.
export function nearestCode(hex) {
  const exact = CODE_BY_HEX.get(hex)
  if (exact) return exact
  const target = parseHex(hex)
  if (!target) return CODE_ALPHABET[0]
  let best = 0
  let bestDist = Infinity
  PALETTE.forEach((candidate, i) => {
    const c = parseHex(candidate)
    const d = (c[0] - target[0]) ** 2 + (c[1] - target[1]) ** 2 + (c[2] - target[2]) ** 2
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return CODE_ALPHABET[best]
}

function parseHex(hex) {
  if (typeof hex !== 'string') return null
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6) return null
  const n = Number.parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function emptyCells() {
  return Array.from({ length: GRID_H }, () => Array(GRID_W).fill(null))
}

export function encodeCells(cells) {
  let out = ''
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const hex = cells[y]?.[x]
      out += hex ? nearestCode(hex) : TRANSPARENT
    }
  }
  return out
}

export function decodeCells(str) {
  const cells = emptyCells()
  if (!isValidAvatar(str)) return cells
  for (let i = 0; i < CELL_COUNT; i++) {
    const code = str[i]
    if (code === TRANSPARENT) continue
    cells[Math.floor(i / GRID_W)][i % GRID_W] = codeToHex(code)
  }
  return cells
}

// speciesArt() returns overlapping rects painted in order; flatten to cells.
export function rectsToCells(rects) {
  const cells = emptyCells()
  for (const r of rects) {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) cells[y][x] = r.fill
      }
    }
  }
  return cells
}

// Greedy maximal rectangles, so rendering one avatar is a handful of <rect>s
// instead of 48. Output is non-overlapping and pixel-identical to the input.
export function cellsToRects(cells) {
  const used = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(false))
  const out = []
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const fill = cells[y][x]
      if (!fill || used[y][x]) continue
      let w = 1
      while (x + w < GRID_W && cells[y][x + w] === fill && !used[y][x + w]) w++
      let h = 1
      grow: while (y + h < GRID_H) {
        for (let i = 0; i < w; i++) {
          if (cells[y + h][x + i] !== fill || used[y + h][x + i]) break grow
        }
        h++
      }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = true
      out.push({ x, y, w, h, fill })
    }
  }
  return out
}

export function avatarToRects(str) {
  return cellsToRects(decodeCells(str))
}
