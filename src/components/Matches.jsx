import { useState } from 'react'
import Avatar from './Avatar.jsx'
import { NIGHT_CAP, TIME_SLOTS, combineDateAndTime, formatNightWhen, isFull, joinedPlayers, upcomingDays } from '../lib/nights.js'

const WEEKDAY_SHORT = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const DAYS = upcomingDays()

function GameCard({ night, players, me, onJoin, onLeave }) {
  const joined = joinedPlayers(night, players)
  const full = isFull(joined.length)
  const mine = night.playerIds.has(me.id)

  return (
    <div className="game">
      <div className="when">
        <span className="d p2">{formatNightWhen(night.starts_at)}</span>
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
    </div>
  )
}

export default function Matches({ nights, players, me, onJoin, onLeave, onPlan }) {
  const [selectedDay, setSelectedDay] = useState(4)
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS.length - 1)
  const [message, setMessage] = useState('')

  if (!me) return null

  async function handlePlan() {
    const startsAt = combineDateAndTime(DAYS[selectedDay], TIME_SLOTS[selectedTime])
    await onPlan(startsAt)
    setMessage(`★ PLANNED ${formatNightWhen(startsAt)} — THE BOYS GOT A PUSH!`)
  }

  return (
    <>
      <section>
        <h2 className="p2">UPCOMING</h2>
        {nights.length === 0 ? (
          <div className="note">no games planned yet</div>
        ) : (
          nights.map((night) => (
            <GameCard key={night.id} night={night} players={players} me={me} onJoin={onJoin} onLeave={onLeave} />
          ))
        )}
      </section>

      <section>
        <h2 className="p2">PLAN A GAME</h2>
        <div className="box">
          <div className="hint">Pick a day (next 2 weeks) and a time:</div>
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
          <div className="chips">
            {TIME_SLOTS.map((time, i) => (
              <button
                key={time}
                className={`chip ${selectedTime === i ? 'on' : ''}`}
                onClick={() => setSelectedTime(i)}
              >
                {time}
              </button>
            ))}
          </div>
          <button className="shuf" onClick={handlePlan}>PLAN GAME</button>
          <div className="bookmsg">{message}</div>
        </div>
      </section>
    </>
  )
}
