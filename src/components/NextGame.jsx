import { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import { NIGHT_CAP, formatNightWhen, isFull, joinedPlayers, playerName, spotsRemaining } from '../lib/nights.js'
import { SCHEDULE_SET_COUNT, fairnessPercent, isScheduleLocked } from '../lib/schedule.js'
import { downloadNightIcs } from '../lib/calendar.js'

const SLOTS_PER_SET = 4
const TOTAL_SLOTS = SCHEDULE_SET_COUNT * SLOTS_PER_SET
const REVEAL_DELAY_MS = 500
const REVEAL_STEP_MS = 220

function ReelSlot({ revealed, playerId, players, joined }) {
  if (revealed) {
    const player = players.find((p) => p.id === playerId)
    return <Avatar player={player} className="sm" />
  }
  return (
    <span className="reel">
      <span className="strip">
        {[...joined, ...joined].map((p, i) => (
          <Avatar key={i} player={p} className="sm" />
        ))}
      </span>
    </span>
  )
}

function ScheduleSet({ set, index, players, joined, ratings, revealCount }) {
  const base = index * SLOTS_PER_SET
  const slotIds = [...set.a, ...set.b]
  const revealedFlags = slotIds.map((_, i) => revealCount > base + i)
  const setRevealed = revealedFlags.every(Boolean)

  return (
    <div className="sline">
      <span className="lbl p2">SET {index + 1}</span>
      <div className="tset">
        <div className="trow">
          <span className="reelgrp">
            {set.a.map((id, i) => (
              <ReelSlot key={id} revealed={revealedFlags[i]} playerId={id} players={players} joined={joined} />
            ))}
          </span>
          <i>VS</i>
          <span className="reelgrp">
            {set.b.map((id, i) => (
              <ReelSlot key={id} revealed={revealedFlags[2 + i]} playerId={id} players={players} joined={joined} />
            ))}
          </span>
        </div>
        <div className="tnames">
          {setRevealed ? (
            <>
              {set.a.map((id) => playerName(players, id)).join('+')} vs {set.b.map((id) => playerName(players, id)).join('+')}
              {' · '}
              <b>FAIR {fairnessPercent(ratings, set.a, set.b)}%</b>
            </>
          ) : (
            '??? vs ???'
          )}
        </div>
      </div>
    </div>
  )
}

export default function NextGame({ night, players, ratings, onShuffle, shuffleToken }) {
  const joined = joinedPlayers(night, players)
  const full = isFull(joined.length)
  const setCount = night.sets?.length ?? 0
  const locked = isScheduleLocked(setCount)
  const [revealCount, setRevealCount] = useState(TOTAL_SLOTS)

  useEffect(() => {
    if (shuffleToken == null || !night.schedule) return undefined
    setRevealCount(0)
    const timers = Array.from({ length: TOTAL_SLOTS }, (_, i) =>
      setTimeout(() => setRevealCount((n) => Math.max(n, i + 1)), REVEAL_DELAY_MS + i * REVEAL_STEP_MS),
    )
    return () => timers.forEach(clearTimeout)
    // shuffleToken alone identifies a fresh shuffle; night.schedule changes on every re-render otherwise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffleToken])

  const dealing = shuffleToken != null && revealCount < TOTAL_SLOTS

  return (
    <section>
      <h2 className="p2">NEXT GAME</h2>
      <div className="box">
        <div className="when">
          <span className="d p2">{formatNightWhen(night.starts_at, night.ends_at)}</span>
          <span className="whenr">
            <button
              type="button"
              className="calbtn p2"
              onClick={() => downloadNightIcs(night, joined.map((p) => p.name))}
            >
              +CAL
            </button>
            {full ? (
              <span className="fullb p2">FULL {NIGHT_CAP}/{NIGHT_CAP}</span>
            ) : (
              <span className="c p2">{joined.length}/{NIGHT_CAP}</span>
            )}
          </span>
        </div>
        <div className="presence">
          {joined.map((p) => (
            <span className="pa" key={p.id}>
              <Avatar player={p} className="sm" />
            </span>
          ))}
        </div>
        {!full ? (
          <div className="note">
            NEED <b>{spotsRemaining(joined.length)} MORE</b> — join via matches tab
          </div>
        ) : !night.schedule ? (
          <div className="qm p2">? ? ?</div>
        ) : (
          night.schedule.map((set, i) => (
            <ScheduleSet
              key={i}
              set={set}
              index={i}
              players={players}
              joined={joined}
              ratings={ratings}
              revealCount={revealCount}
            />
          ))
        )}
        {full && (
          <>
            <button className="shuf" disabled={locked} onClick={() => onShuffle(night)}>
              SHUFFLE NIGHT
            </button>
            <div id="fair">{dealing ? 'DEALING...' : ''}</div>
            <div className="note">
              {locked ? '■ SCHEDULE LOCKED – FIRST SCORE IS IN' : '★ anyone can reshuffle until the first score is logged'}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
