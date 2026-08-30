import { computePrizePool, nightSavings } from '../lib/savings.js'

function Coin() {
  return (
    <svg className="coin" viewBox="0 0 8 8" aria-hidden="true">
      <rect x="2" y="0" width="4" height="8" fill="#c47d1a" />
      <rect x="1" y="1" width="6" height="6" fill="#c47d1a" />
      <rect x="0" y="2" width="8" height="4" fill="#c47d1a" />
      <rect x="2" y="1" width="4" height="6" fill="#ffd23a" />
      <rect x="1" y="2" width="6" height="4" fill="#ffd23a" />
      <rect x="2" y="2" width="1" height="2" fill="#ffe9cf" />
      <rect x="3" y="2" width="2" height="4" fill="#ffb03a" />
      <rect x="5" y="4" width="1" height="2" fill="#c47d1a" />
    </svg>
  )
}

// Four digits hold everything up to €9999; the pool grows by tens, so the
// units digit is the one that never moves and the hundreds one is the prize.
function Odometer({ amount }) {
  const digits = String(amount).padStart(4, '0').split('')
  return (
    <div className="odo">
      <span className="cur">€</span>
      {digits.map((digit, i) => (
        <span className={`dg${i === digits.length - 1 ? ' hot' : ''}`} key={i}>
          {digit}
        </span>
      ))}
    </div>
  )
}

function LevelBar({ filled, total }) {
  return (
    <div className="bar">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < filled ? (i === filled - 1 ? 'on tip' : 'on') : ''} />
      ))}
    </div>
  )
}

// Why the next night adds nothing to the pool: no night planned, booked
// somewhere else, or planned before end times existed so there are no hours
// to price. Each reads differently on the badge.
function pendingLabel(nextNight) {
  if (!nextNight) return 'NO GAME PLANNED'
  if (!nextNight.at_cronos) return 'NOT AT CRONOS'
  return 'NO SLOT TIME'
}

// The pool sits directly under NEXT GAME, so "this night" always means the
// night shown above it — pending until that night is finished and logged.
export default function PrizePool({ nights, nextNight }) {
  const pool = computePrizePool(nights)
  const pending = nextNight ? nightSavings(nextNight) : 0

  return (
    <section>
      <h2 className="p2">PRIZE POOL</h2>
      <div className="pool">
        <div className="poolhead">
          <span className="t">TEAM SAVINGS</span>
          {pending > 0 ? (
            <span className="n">+€{pending} PENDING</span>
          ) : (
            <span className="n off">{pendingLabel(nextNight)}</span>
          )}
        </div>
        <Odometer amount={pool.banked} />
        <div className="poolsub">
          BANKED OVER <b>{pool.cronosNights}</b> NIGHT{pool.cronosNights === 1 ? '' : 'S'} AT CRONOS
        </div>
        <LevelBar filled={pool.filledSegments} total={pool.totalSegments} />
        <div className="goal">
          <span>LEVEL {pool.level}</span>
          <span>
            <b>€{pool.toNextLevel}</b> TO LEVEL {pool.level + 1}
          </span>
        </div>
        <div className="coinrow">
          {Array.from({ length: 5 }, (_, i) => (
            <Coin key={i} />
          ))}
        </div>
      </div>
      <div className="note">★ €20 saved per hour every time we book at cronos</div>
    </section>
  )
}
