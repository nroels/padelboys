import { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import {
  NIGHT_CAP,
  formatNightWhen,
  isFull,
  isReady,
  joinedPlayers,
  playerName,
  playersNeeded,
} from '../lib/nights.js'
import { fairnessPercent, isScheduleLocked, roundCountFor } from '../lib/schedule.js'

const SLOTS_PER_SET = 4
const REVEAL_DELAY_MS = 500
const REVEAL_STEP_MS = 220
// A 15-round night has 60 slots; dealing them all at the full step would run
// for 13 seconds, so long schedules deal faster rather than longer.
const REVEAL_TOTAL_MS = 3000

function revealStepMs(totalSlots) {
  return Math.min(REVEAL_STEP_MS, REVEAL_TOTAL_MS / Math.max(1, totalSlots))
}

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
  const sittingOut = set.out ?? []

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
              {sittingOut.length > 0 && (
                <>
                  {' · '}
                  <span className="sitout">SITS {sittingOut.map((id) => playerName(players, id)).join('+')}</span>
                </>
              )}
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
  const ready = isReady(joined.length)
  const setCount = night.sets?.length ?? 0
  const locked = isScheduleLocked(setCount)
  const rounds = roundCountFor(joined.length)
  const totalSlots = (night.schedule?.length ?? rounds) * SLOTS_PER_SET
  const [revealCount, setRevealCount] = useState(Number.MAX_SAFE_INTEGER)

  useEffect(() => {
    if (shuffleToken == null || !night.schedule) return undefined
    const slots = night.schedule.length * SLOTS_PER_SET
    const step = revealStepMs(slots)
    setRevealCount(0)
    const timers = Array.from({ length: slots }, (_, i) =>
      setTimeout(() => setRevealCount((n) => Math.max(n, i + 1)), REVEAL_DELAY_MS + i * step),
    )
    return () => timers.forEach(clearTimeout)
    // shuffleToken alone identifies a fresh shuffle; night.schedule changes on every re-render otherwise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffleToken])

  const dealing = shuffleToken != null && revealCount < totalSlots

  return (
    <section>
      <h2 className="p2">NEXT GAME</h2>
      <div className="box">
        <div className="when">
          <span className="d p2">{formatNightWhen(night.starts_at, night.ends_at)}</span>
          {full ? (
            <span className="fullb p2">FULL {NIGHT_CAP}/{NIGHT_CAP}</span>
          ) : (
            <span className="c p2">{joined.length}/{NIGHT_CAP}</span>
          )}
        </div>
        <div className="presence">
          {joined.map((p) => (
            <span className="pa" key={p.id}>
              <Avatar player={p} className="sm" />
            </span>
          ))}
        </div>
        {!ready ? (
          <div className="note">
            NEED <b>{playersNeeded(joined.length)} MORE</b> — join via matches tab
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
        {ready && (
          <>
            <button className="shuf" disabled={locked} onClick={() => onShuffle(night)}>
              SHUFFLE NIGHT
            </button>
            <div id="fair">{dealing ? 'DEALING...' : ''}</div>
          </>
        )}
      </div>
    </section>
  )
}
