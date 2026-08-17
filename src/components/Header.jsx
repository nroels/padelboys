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
  const tickerText = '★ ' + items.join(' · ') + ' '
  return (
    <div className="ticker">
      <span className="tk">{tickerText}</span>
      <span className="tk">{tickerText}</span>
    </div>
  )
}
