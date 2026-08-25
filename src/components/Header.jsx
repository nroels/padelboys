// Enough characters to overflow the widest strip (420px) at 8px per glyph.
const MIN_TICKER_CHARS = 60
const SECONDS_PER_CHAR = 0.45

export default function Header() {
  return (
    <header>
      <div className="logo p2">
        PADEL<span>BOYS</span>
        <span className="hball"></span>
      </div>
    </header>
  )
}

export function Ticker({ items }) {
  // Both copies scroll by 100% of their own width, so they only tile
  // seamlessly when each one is wider than the strip. Short item lists get
  // repeated until they are long enough, and the duration follows the length
  // so the text always rolls past at the same speed.
  const unit = '\u2605 ' + items.join(' \u00b7 ') + ' '
  const repeats = Math.max(1, Math.ceil(MIN_TICKER_CHARS / unit.length))
  const tickerText = unit.repeat(repeats)
  const duration = `${(tickerText.length * SECONDS_PER_CHAR).toFixed(1)}s`
  return (
    <div className="ticker">
      <span className="tk" style={{ animationDuration: duration }}>{tickerText}</span>
      <span className="tk" style={{ animationDuration: duration }}>{tickerText}</span>
    </div>
  )
}
