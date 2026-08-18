import { useState } from 'react'
import Avatar from './Avatar.jsx'
import { playerName } from '../lib/nights.js'
import { isValidScore } from '../lib/schedule.js'

function toggle(picked, other, id) {
  if (other.includes(id)) return picked
  if (picked.includes(id)) return picked.filter((p) => p !== id)
  const next = [...picked, id]
  return next.length > 2 ? next.slice(1) : next
}

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time, not UTC.
function nowForInput() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export default function AdminHistory({ players, onAddHistory }) {
  const [open, setOpen] = useState(false)
  const [when, setWhen] = useState(nowForInput)
  const [teamA, setTeamA] = useState([])
  const [teamB, setTeamB] = useState([])
  const [score, setScore] = useState([0, 0])
  const [pendingSets, setPendingSets] = useState([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  function reset() {
    setPendingSets([])
    setTeamA([])
    setTeamB([])
    setScore([0, 0])
    setMessage('')
    setWhen(nowForInput())
  }

  function step(team, delta) {
    setScore((prev) => {
      const next = [...prev]
      next[team] = Math.min(7, Math.max(0, next[team] + delta))
      return next
    })
  }

  function addSet() {
    if (teamA.length !== 2 || teamB.length !== 2) {
      setMessage('PICK 2 PLAYERS PER TEAM!')
      return
    }
    if (!isValidScore(score[0], score[1])) {
      setMessage('A SET HAS A WINNER!')
      return
    }
    setPendingSets((prev) => [...prev, { teamA, teamB, scoreA: score[0], scoreB: score[1] }])
    setScore([0, 0])
    setMessage('')
  }

  function removeSet(index) {
    setPendingSets((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSaveNight() {
    if (pendingSets.length === 0) {
      setMessage('ADD AT LEAST 1 SET!')
      return
    }
    setSaving(true)
    const ok = await onAddHistory(new Date(when), pendingSets)
    setSaving(false)
    if (!ok) {
      setMessage('FAILED TO SAVE — TRY AGAIN')
      return
    }
    reset()
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="box soon">
        <button className="shuf ghost" onClick={() => setOpen(true)}>+ ADD PAST GAME</button>
      </div>
    )
  }

  return (
    <div className="box">
      <div className="hint">WHEN:</div>
      <input
        type="datetime-local"
        className="pxinput p2"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
      />
      {pendingSets.length > 0 && (
        <div>
          {pendingSets.map((s, i) => (
            <div className="loggedset" key={i}>
              <span>
                {s.teamA.map((id) => playerName(players, id)).join('+')} vs{' '}
                {s.teamB.map((id) => playerName(players, id)).join('+')}
              </span>
              <span className="sc">{s.scoreA}-{s.scoreB}</span>
              <button type="button" className="xdel" onClick={() => removeSet(i)}>X</button>
            </div>
          ))}
        </div>
      )}
      <div className="hint">TEAM A:</div>
      <div className="pickrow">
        {players.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`pk ${teamA.includes(p.id) ? 'sel' : ''}`}
            style={teamB.includes(p.id) ? { opacity: 0.22 } : undefined}
            aria-label={p.name}
            onClick={() => setTeamA((t) => toggle(t, teamB, p.id))}
          >
            <Avatar player={p} className="sm" />
          </button>
        ))}
      </div>
      <div className="hint">TEAM B:</div>
      <div className="pickrow">
        {players.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`pk ${teamB.includes(p.id) ? 'sel' : ''}`}
            style={teamA.includes(p.id) ? { opacity: 0.22 } : undefined}
            aria-label={p.name}
            onClick={() => setTeamB((t) => toggle(t, teamA, p.id))}
          >
            <Avatar player={p} className="sm" />
          </button>
        ))}
      </div>
      <div className="hint" style={{ marginTop: '10px' }}>SET SCORE:</div>
      <div className="setrow">
        <span className="setlbl p2">SCORE</span>
        <span className="step">
          <button type="button" onClick={() => step(0, -1)}>-</button>
          <span className="val">{score[0]}</span>
          <button type="button" onClick={() => step(0, 1)}>+</button>
        </span>
        <span className="setdash p2">-</span>
        <span className="step">
          <button type="button" onClick={() => step(1, -1)}>-</button>
          <span className="val">{score[1]}</span>
          <button type="button" onClick={() => step(1, 1)}>+</button>
        </span>
      </div>
      <button className="shuf ghost" type="button" onClick={addSet}>+ ADD SET</button>
      <button className="shuf" onClick={handleSaveNight} disabled={saving}>SAVE NIGHT TO HISTORY</button>
      <button className="shuf ghost" type="button" onClick={() => { reset(); setOpen(false) }}>CANCEL</button>
      <div className="note">{message}</div>
    </div>
  )
}
