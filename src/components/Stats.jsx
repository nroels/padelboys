import { useState } from 'react'
import Avatar from './Avatar.jsx'
import { playerName } from '../lib/nights.js'
import { DUO_MIN_SETS, bestDuos, headToHead } from '../lib/stats.js'

function PlayerSelect({ players, value, onChange }) {
  return (
    <select className="pxinput rivsel" value={value} onChange={(e) => onChange(e.target.value)}>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  )
}

export default function Stats({ sets, players, rankings }) {
  const [playerA, setPlayerA] = useState(players[0]?.id ?? '')
  const [playerB, setPlayerB] = useState(players[1]?.id ?? '')
  const sameChoice = playerA === playerB
  const h2h = sameChoice ? null : headToHead(sets, playerA, playerB)
  const duos = bestDuos(sets)

  return (
    <>
      <section>
        <h2 className="p2">RIVALRY</h2>
        <div className="box">
          <div className="rivrow">
            <PlayerSelect players={players} value={playerA} onChange={setPlayerA} />
            <span className="p2">VS</span>
            <PlayerSelect players={players} value={playerB} onChange={setPlayerB} />
          </div>
          {sameChoice ? (
            <div className="note">pick two different players</div>
          ) : h2h.sets === 0 ? (
            <div className="note">these two haven't faced off yet</div>
          ) : (
            <div className="rivscore p2">
              {h2h.winsA} - {h2h.winsB}
              <div className="note">{h2h.sets} SETS HEAD TO HEAD</div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="p2">BEST DUOS</h2>
        {duos.length === 0 ? (
          <div className="note">need {DUO_MIN_SETS}+ sets together to rank a duo</div>
        ) : (
          <div className="box">
            {duos.map((d) => (
              <div className="duorow" key={`${d.a}-${d.b}`}>
                <span>
                  {playerName(players, d.a)} + {playerName(players, d.b)}
                </span>
                <span className="p2">{d.winPct}%</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="p2">STREAKS</h2>
        <div className="box">
          {rankings.map((r) => (
            <div className="streakrow" key={r.playerId}>
              <Avatar player={players.find((p) => p.id === r.playerId)} className="sm" />
              <span className="sname">{playerName(players, r.playerId)}</span>
              <span className={`p2 ${r.streak.count >= 2 ? (r.streak.type === 'W' ? 'up' : 'down') : ''}`}>
                {r.streak.count > 0 ? `${r.streak.type}${r.streak.count}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
