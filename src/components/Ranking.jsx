import Avatar from './Avatar.jsx'
import { playerName } from '../lib/nights.js'

function StreakBadge({ streak }) {
  if (streak.count < 2) return null
  return <span className={`streakb p2 ${streak.type === 'W' ? 'up' : 'down'}`}>{streak.type}{streak.count}</span>
}

export default function Ranking({ rankings, players }) {
  return (
    <section>
      <h2 className="p2">RANKING</h2>
      <div className="box">
        {rankings.map((r, i) => (
          <div className="rrow" key={r.playerId}>
            <span className="rpos p2">{i + 1}</span>
            <Avatar player={players.find((p) => p.id === r.playerId)} className="sm" />
            <span className="rname">{playerName(players, r.playerId)}</span>
            <span className="rwl">{r.wins}-{r.losses}</span>
            <span className={`rdelta ${r.delta >= 0 ? 'up' : 'down'}`}>
              {r.delta >= 0 ? '+' : ''}
              {r.delta}
            </span>
            <StreakBadge streak={r.streak} />
            <span className="relo p2">{r.rating}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
