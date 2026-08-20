import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import { SPECIES, avatarFromSpecies } from '../lib/avatars.js'
import {
  GRID_H,
  GRID_W,
  PALETTE,
  PALETTE_GROUPS,
  TRANSPARENT,
  decodeCells,
  encodeCells,
  hexToCode,
  isValidAvatar,
} from '../lib/pixels.js'

const SAVE_DEBOUNCE_MS = 600

export default function AvatarEditor({ me, onAvatarChange }) {
  const [cells, setCells] = useState(() => startingCells(me))
  const [colour, setColour] = useState(PALETTE[0])
  const [erasing, setErasing] = useState(false)
  const [note, setNote] = useState('')
  const painting = useRef(false)
  const saveTimer = useRef(null)
  // Mirrors `cells` so a fast drag painting several cells in one frame always
  // reads the latest grid instead of the value captured at render.
  const cellsRef = useRef(cells)

  // Reset when switching player; don't clobber the local grid on every render.
  useEffect(() => {
    const next = startingCells(me)
    cellsRef.current = next
    setCells(next)
    setNote('')
    clearTimeout(saveTimer.current)
  }, [me?.id])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  function commit(next) {
    cellsRef.current = next
    setCells(next)
    setNote('')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onAvatarChange(encodeCells(next)).then((ok) => setNote(ok ? '★ SAVED' : '★ COULD NOT SAVE'))
    }, SAVE_DEBOUNCE_MS)
  }

  function paint(x, y) {
    const value = erasing ? null : colour
    const prev = cellsRef.current
    if (prev[y][x] === value) return
    const next = prev.map((row) => row.slice())
    next[y][x] = value
    commit(next)
  }

  function handleDown(x, y, e) {
    e.preventDefault()
    painting.current = true
    paint(x, y)
  }

  // Touch never fires enter/over on the cells you drag across, so resolve the
  // cell under the finger from the grid geometry instead.
  function handleMove(e) {
    if (!painting.current) return
    const touch = e.touches?.[0]
    const point = touch ?? e
    const el = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((point.clientX - el.left) / el.width) * GRID_W)
    const y = Math.floor(((point.clientY - el.top) / el.height) * GRID_H)
    if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) paint(x, y)
  }

  useEffect(() => {
    const stop = () => { painting.current = false }
    window.addEventListener('pointerup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [])

  const preview = { ...me, avatar: encodeCells(cells) }

  return (
    <div className="ped">
      <div className="pedtop">
        <Avatar player={preview} className="lg" />
        <div className="pedmeta">
          <div className="note">{note}</div>
          <button className="pedclear" onClick={() => commit(decodeCells(TRANSPARENT.repeat(GRID_W * GRID_H)))}>
            CLEAR
          </button>
        </div>
      </div>

      <div
        className="pgrid"
        onPointerMove={handleMove}
        onTouchMove={handleMove}
      >
        {cells.map((row, y) =>
          row.map((hex, x) => (
            <button
              key={`${x}-${y}`}
              className={hex ? 'pc' : 'pc empty'}
              style={hex ? { background: hex } : undefined}
              onPointerDown={(e) => handleDown(x, y, e)}
              aria-label={`cell ${x},${y}`}
            />
          )),
        )}
      </div>
      <div className="pedband" style={{ background: me.accent }}>ACCENT BAND</div>

      <div className="hint" style={{ marginTop: 14 }}>COLOUR:</div>
      <div className="pedpal">
        <button
          className={erasing ? 'pw er on' : 'pw er'}
          onClick={() => setErasing(true)}
          aria-label="Eraser"
        >✕</button>
        {PALETTE_GROUPS.map((g) => (
          <span key={g.label} className="pwgroup">
            {PALETTE.slice(g.from, g.to + 1).map((c) => (
              <button
                key={c}
                className={!erasing && c === colour ? 'pw on' : 'pw'}
                style={{ background: c }}
                aria-label={c}
                onClick={() => { setColour(c); setErasing(false) }}
              />
            ))}
          </span>
        ))}
      </div>

      <div className="hint" style={{ marginTop: 14 }}>START FROM:</div>
      <div className="pedpresets">
        {SPECIES.map((s) => (
          <button key={s.key} onClick={() => commit(decodeCells(avatarFromSpecies(s.key, me)))}>
            <Avatar player={{ ...me, avatar: avatarFromSpecies(s.key, me) }} className="sm" />
            <div className="nm p2">{s.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function startingCells(me) {
  if (!me) return decodeCells(TRANSPARENT.repeat(GRID_W * GRID_H))
  if (isValidAvatar(me.avatar)) return decodeCells(me.avatar)
  return decodeCells(avatarFromSpecies(me.species, me))
}
