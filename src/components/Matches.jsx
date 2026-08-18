import { useState } from 'react'
import Avatar from './Avatar.jsx'
import AdminHistory from './AdminHistory.jsx'
import {
  NIGHT_CAP,
  combineDateAndTime,
  formatNightWhen,
  isFull,
  joinedPlayers,
  playerName,
  upcomingDays,
} from '../lib/nights.js'

const WEEKDAY_SHORT = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const DAYS = upcomingDays()
const DEFAULT_TIME = '20:00'
const DEFAULT_END_TIME = '21:30'

function teamNames(players, ids) {
  return ids.map((id) => playerName(players, id)).join('+')
}

function MatchLine({ set, players }) {
  const aWon = set.score_a > set.score_b
  return (
    <div className="match">
      <span>
        <span className={aWon ? 'w' : ''}>{teamNames(players, set.team_a)}</span> vs{' '}
        <span className={aWon ? '' : 'w'}>{teamNames(players, set.team_b)}</span>
      </span>
      <span className="sc">
        {set.score_a}-{set.score_b}
      </span>
    </div>
  )
}

function NightHistory({ night, players, isAdmin, onDeleteNight }) {
  return (
    <div className="night">
      <div className="nh">
        <span className="d p2">{formatNightWhen(night.starts_at).split(' · ')[0]}</span>
        <span className="c">{night.sets.length} SETS</span>
      </div>
      {night.sets.map((set) => (
        <MatchLine key={set.id} set={set} players={players} />
      ))}
      {isAdmin && (
        <div className="loggedset">
          <span>ADMIN</span>
          <button type="button" className="xdel" onClick={() => onDeleteNight(night.id)}>
            DELETE NIGHT
          </button>
        </div>
      )}
    </div>
  )
}

function GameCard({ night, players, me, isAdmin, onJoin, onLeave, onDeleteNight }) {
  const joined = joinedPlayers(night, players)
  const full = isFull(joined.length)
  const mine = night.playerIds.has(me.id)

  return (
    <div className="game">
      <div className="when">
        <span className="d p2">{formatNightWhen(night.starts_at, night.ends_at)}</span>
        {full ? <span className="fullb p2">FULL</span> : <span className="c p2">{joined.length}/{NIGHT_CAP}</span>}
      </div>
      <div className="avs">
        {joined.map((p) => (
          <Avatar key={p.id} player={p} className="sm" />
        ))}
      </div>
      <button
        className={`joinbtn ${mine ? 'leave' : ''}`}
        disabled={!mine && full}
        onClick={() => (mine ? onLeave(night.id) : onJoin(night.id))}
      >
        {mine ? 'LEAVE' : full ? 'FULL' : 'JOIN'}
      </button>
      {isAdmin && (
        <div className="loggedset">
          <span>ADMIN</span>
          <button type="button" className="xdel" onClick={() => onDeleteNight(night.id)}>
            DELETE GAME
          </button>
        </div>
      )}
    </div>
  )
}

export default function Matches({ nights, history, players, me, isAdmin, onJoin, onLeave, onPlan, onDeleteNight, onAddHistory }) {
  const [selectedDay, setSelectedDay] = useState(4)
  const [selectedTime, setSelectedTime] = useState(DEFAULT_TIME)
  const [selectedEndTime, setSelectedEndTime] = useState(DEFAULT_END_TIME)
  const [message, setMessage] = useState('')

  if (!me) return null

  async function handlePlan() {
    const startsAt = combineDateAndTime(DAYS[selectedDay], selectedTime)
    let endsAt = combineDateAndTime(DAYS[selectedDay], selectedEndTime)
    if (endsAt <= startsAt) endsAt.setDate(endsAt.getDate() + 1)
    await onPlan(startsAt, endsAt)
    setMessage(`★ PLANNED ${formatNightWhen(startsAt, endsAt)} — THE BOYS GOT A PUSH!`)
  }

  return (
    <>
      <section>
        <h2 className="p2">UPCOMING</h2>
        {nights.length === 0 ? (
          <div className="note">no games planned yet</div>
        ) : (
          nights.map((night) => (
            <GameCard
              key={night.id}
              night={night}
              players={players}
              me={me}
              isAdmin={isAdmin}
              onJoin={onJoin}
              onLeave={onLeave}
              onDeleteNight={onDeleteNight}
            />
          ))
        )}
      </section>

      <section>
        <h2 className="p2">PLAN A GAME</h2>
        <div className="box">
          <div className="hint">Pick a day (next 2 weeks) and a start/end time (30-min steps):</div>
          <div className="cal">
            {DAYS.map((day, i) => (
              <button
                key={i}
                className={selectedDay === i ? 'on' : ''}
                onClick={() => setSelectedDay(i)}
              >
                {WEEKDAY_SHORT[day.getDay()]}
                <span className="dn">{day.getDate()}</span>
              </button>
            ))}
          </div>
          <div className="timerow">
            <input
              type="time"
              className="pxinput p2"
              step={1800}
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
            <span className="timesep p2">TO</span>
            <input
              type="time"
              className="pxinput p2"
              step={1800}
              value={selectedEndTime}
              onChange={(e) => setSelectedEndTime(e.target.value)}
            />
          </div>
          <button className="shuf" onClick={handlePlan}>PLAN GAME</button>
          <div className="bookmsg">{message}</div>
        </div>
      </section>

      <section>
        <h2 className="p2">HISTORY</h2>
        {isAdmin && <AdminHistory players={players} onAddHistory={onAddHistory} />}
        {history.length === 0 ? (
          <div className="note">no games played yet</div>
        ) : (
          history.map((night) => (
            <NightHistory key={night.id} night={night} players={players} isAdmin={isAdmin} onDeleteNight={onDeleteNight} />
          ))
        )}
      </section>
    </>
  )
}
