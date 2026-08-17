import { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import { canDeleteSet, formatNightWhen, joinedPlayers, playerName } from '../lib/nights.js'
import { isValidScore } from '../lib/schedule.js'

function prefillTeams(night) {
  const setIndex = night.sets.length
  const set = night.schedule?.[setIndex]
  return set ? [[...set.a], [...set.b]] : [[], []]
}

// Not night.sets.length: deleting a non-last set must not reissue an
// already-used set_index, which would collide with the unique constraint.
function nextSetIndex(sets) {
  return sets.length ? Math.max(...sets.map((s) => s.set_index)) + 1 : 0
}

function toggle(picked, other, id) {
  if (other.includes(id)) return picked
  if (picked.includes(id)) return picked.filter((p) => p !== id)
  const next = [...picked, id]
  return next.length > 2 ? next.slice(1) : next
}

function TeamPicker({ label, roster, players, picked, other, onToggle }) {
  return (
    <>
      <div className="hint">{label}:</div>
      <div className="pickrow">
        {roster.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`pk ${picked.includes(p.id) ? 'sel' : ''}`}
            style={other.includes(p.id) ? { opacity: 0.22 } : undefined}
            aria-label={p.name}
            onClick={() => onToggle(p.id)}
          >
            <Avatar player={p} className="sm" />
          </button>
        ))}
      </div>
    </>
  )
}

function Wizard({ night, players, allNights, onLogSet, onDeleteSet, onFinishNight, onClose }) {
  const roster = joinedPlayers(night, players)
  const [teamA, setTeamA] = useState([])
  const [teamB, setTeamB] = useState([])
  const [score, setScore] = useState([0, 0])
  const [message, setMessage] = useState('')
  const deletable = canDeleteSet(night.id, allNights)

  useEffect(() => {
    const [a, b] = prefillTeams(night)
    setTeamA(a)
    setTeamB(b)
    setScore([0, 0])
    // re-prefill whenever a set is saved/deleted (night.sets.length changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [night.id, night.sets.length])

  function step(team, delta) {
    setScore((prev) => {
      const next = [...prev]
      next[team] = Math.min(7, Math.max(0, next[team] + delta))
      return next
    })
  }

  async function handleSave() {
    if (teamA.length !== 2 || teamB.length !== 2) {
      setMessage('PICK 2 PLAYERS PER TEAM!')
      return
    }
    if (!isValidScore(score[0], score[1])) {
      setMessage('A SET HAS A WINNER!')
      return
    }
    const ok = await onLogSet(night.id, nextSetIndex(night.sets), teamA, teamB, score[0], score[1])
    if (!ok) {
      setMessage('FAILED TO SAVE — TRY AGAIN')
      return
    }
    setMessage('★ SET SAVED — NEXT ONE')
    setTimeout(() => setMessage(''), 1600)
  }

  async function handleFinish() {
    if (night.sets.length === 0) {
      setMessage('LOG AT LEAST 1 SET FIRST!')
      return
    }
    await onFinishNight(night.id)
    onClose()
  }

  return (
    <section>
      <h2 className="p2">LOG SCORES</h2>
      <div className="box">
        <div className="when">
          <span className="d p2">{formatNightWhen(night.starts_at, night.ends_at)}</span>
          <span className="setchip">SET {night.sets.length + 1}</span>
        </div>
        <div>
          {night.sets.map((s) => (
            <div className="loggedset" key={s.id}>
              <span>
                {s.team_a.map((id) => playerName(players, id)).join('+')} vs{' '}
                {s.team_b.map((id) => playerName(players, id)).join('+')}
              </span>
              <span className="sc">{s.score_a}-{s.score_b}</span>
              {deletable && (
                <button type="button" className="xdel" onClick={() => onDeleteSet(night.id, s.id)}>
                  X
                </button>
              )}
            </div>
          ))}
        </div>
        <TeamPicker label="TEAM A" roster={roster} players={players} picked={teamA} other={teamB} onToggle={(id) => setTeamA((t) => toggle(t, teamB, id))} />
        <TeamPicker label="TEAM B" roster={roster} players={players} picked={teamB} other={teamA} onToggle={(id) => setTeamB((t) => toggle(t, teamA, id))} />
        <div className="note">
          {night.schedule?.[night.sets.length]
            ? '★ prefilled from the schedule — tap avatars to change'
            : '▲ extra set — pick the teams yourself'}
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
        <button className="shuf" onClick={handleSave}>SAVE SET</button>
        <div className="wizrow">
          <button className="shuf ghost" onClick={handleFinish}>FINISH NIGHT</button>
        </div>
        <div id="logMsg">{message}</div>
      </div>
    </section>
  )
}

export default function Log({ nights, allNights, players, onLogSet, onDeleteSet, onFinishNight }) {
  const [openNightId, setOpenNightId] = useState(null)
  const openNight = nights.find((n) => n.id === openNightId) ?? null

  if (openNight) {
    return (
      <Wizard
        night={openNight}
        players={players}
        allNights={allNights}
        onLogSet={onLogSet}
        onDeleteSet={onDeleteSet}
        onFinishNight={onFinishNight}
        onClose={() => setOpenNightId(null)}
      />
    )
  }

  return (
    <section>
      <h2 className="p2">LOG SCORES</h2>
      <div className="hint">Played games waiting for scores:</div>
      {nights.length === 0 ? (
        <div className="box soon">
          <div className="big p2">NO GAMES TO SCORE</div>
          plan one via the matches tab
        </div>
      ) : (
        nights.map((night) => {
          const joined = joinedPlayers(night, players)
          return (
            <div className="game" key={night.id}>
              <div className="when">
                <span className="d p2">{formatNightWhen(night.starts_at, night.ends_at)}</span>
                <span className="c p2">{night.sets.length} SETS IN</span>
              </div>
              <div className="avs">
                {joined.map((p) => (
                  <Avatar key={p.id} player={p} className="sm" />
                ))}
              </div>
              <button className="joinbtn" onClick={() => setOpenNightId(night.id)}>
                LOG SCORES
              </button>
            </div>
          )
        })
      )}
    </section>
  )
}
