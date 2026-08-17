import Avatar from './Avatar.jsx'
import { NIGHT_CAP, formatNightWhen, isFull, joinedPlayers, spotsRemaining } from '../lib/nights.js'

export default function NextGame({ night, players }) {
  const joined = joinedPlayers(night, players)
  const full = isFull(joined.length)

  return (
    <section>
      <h2 className="p2">NEXT GAME</h2>
      <div className="box">
        <div className="when">
          <span className="d p2">{formatNightWhen(night.starts_at)}</span>
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
        {!full && (
          <div className="note">
            NEED <b>{spotsRemaining(joined.length)} MORE</b> — join via matches tab
          </div>
        )}
      </div>
    </section>
  )
}
