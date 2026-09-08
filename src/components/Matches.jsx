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
import { downloadNightIcs } from '../lib/calendar.js'
import { nightSavings } from '../lib/savings.js'

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

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time, not UTC; split it
// into the separate date and time boxes the plan-a-game form already uses.
function toLocalDateAndTime(isoOrDate) {
  const date = new Date(isoOrDate)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  const [day, time] = date.toISOString().slice(0, 16).split('T')
  return [day, time]
}

function EditTime({ night, onEditTime, onClose }) {
  const [startDate, startTime] = toLocalDateAndTime(night.starts_at)
  const [, endTime] = toLocalDateAndTime(night.ends_at ?? night.starts_at)
  const [date, setDate] = useState(startDate)
  const [time, setTime] = useState(startTime)
  const [endTimeValue, setEndTimeValue] = useState(endTime)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const start = combineDateAndTime(new Date(`${date}T00:00`), time)
    const end = combineDateAndTime(new Date(`${date}T00:00`), endTimeValue)
    if (end <= start) end.setDate(end.getDate() + 1)
    setSaving(true)
    const ok = await onEditTime(night.id, start, end)
    setSaving(false)
    if (!ok) {
      setMessage('FAILED TO SAVE — TRY AGAIN')
      return
    }
    onClose()
  }

  return (
    <div className="loggedset" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
      <div className="hint">DATE:</div>
      <input
        type="date"
        className="pxinput p2"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="hint">TIME:</div>
      <div className="timerow">
        <input
          type="time"
          className="pxinput p2"
          step={1800}
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <span className="timesep p2">TO</span>
        <input
          type="time"
          className="pxinput p2"
          step={1800}
          value={endTimeValue}
          onChange={(e) => setEndTimeValue(e.target.value)}
        />
      </div>
      <button className="shuf ghost" type="button" onClick={handleSave} disabled={saving}>
        SAVE TIME
      </button>
      <button className="shuf ghost" type="button" onClick={onClose}>
        CANCEL
      </button>
      <div className="note">{message}</div>
    </div>
  )
}

function GameCard({ night, players, me, isAdmin, onJoin, onLeave, onDeleteNight, onEditTime }) {
  const joined = joinedPlayers(night, players)
  const full = isFull(joined.length)
  const mine = night.playerIds.has(me.id)
  const [editing, setEditing] = useState(false)

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
      <div className="btnrow">
        <button
          className={`joinbtn ${mine ? 'leave' : ''}`}
          disabled={!mine && full}
          onClick={() => (mine ? onLeave(night.id) : onJoin(night.id))}
        >
          {mine ? 'LEAVE' : full ? 'FULL' : 'JOIN'}
        </button>
        <button
          type="button"
          className="calbtn"
          onClick={() => downloadNightIcs(night, joined.map((p) => p.name))}
        >
          +CAL
        </button>
      </div>
      {isAdmin && editing && (
        <EditTime night={night} onEditTime={onEditTime} onClose={() => setEditing(false)} />
      )}
      {isAdmin && !editing && (
        <div className="loggedset">
          <span>ADMIN</span>
          <button type="button" className="xdel" onClick={() => setEditing(true)}>
            EDIT TIME
          </button>
          <button type="button" className="xdel" onClick={() => onDeleteNight(night.id)}>
            DELETE GAME
          </button>
        </div>
      )}
    </div>
  )
}

export default function Matches({ nights, history, players, me, isAdmin, onJoin, onLeave, onPlan, onDeleteNight, onAddHistory, onEditTime }) {
  const [selectedDay, setSelectedDay] = useState(4)
  const [selectedTime, setSelectedTime] = useState(DEFAULT_TIME)
  const [selectedEndTime, setSelectedEndTime] = useState(DEFAULT_END_TIME)
  // Cronos is the default court, so the lever ships on and only gets flipped
  // on the rare night the boys book somewhere else.
  const [atCronos, setAtCronos] = useState(true)
  const [message, setMessage] = useState('')

  if (!me) return null

  function plannedSlot() {
    const startsAt = combineDateAndTime(DAYS[selectedDay], selectedTime)
    const endsAt = combineDateAndTime(DAYS[selectedDay], selectedEndTime)
    if (endsAt <= startsAt) endsAt.setDate(endsAt.getDate() + 1)
    return { startsAt, endsAt }
  }

  async function handlePlan() {
    const { startsAt, endsAt } = plannedSlot()
    await onPlan(startsAt, endsAt, atCronos)
    setMessage(`★ PLANNED ${formatNightWhen(startsAt, endsAt)} — THE BOYS GOT A PUSH!`)
  }

  const { startsAt, endsAt } = plannedSlot()
  const wouldSave = nightSavings({ starts_at: startsAt, ends_at: endsAt, at_cronos: atCronos })

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
              onEditTime={onEditTime}
            />
          ))
        )}
      </section>

      <section>
        <h2 className="p2">PLAN A GAME</h2>
        <div className="box">
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
          <button
            type="button"
            className={`lever ${atCronos ? 'on' : ''}`}
            aria-pressed={atCronos}
            onClick={() => setAtCronos((on) => !on)}
          >
            <span className="track"><span className="knob"></span></span>
            <span className="txt">
              {atCronos ? 'BOOKED AT CRONOS' : 'BOOKED ELSEWHERE'}
              <small>{wouldSave > 0 ? `ADDS €${wouldSave} TO THE POOL` : 'NOTHING BANKED THIS NIGHT'}</small>
            </span>
          </button>
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
