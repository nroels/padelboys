const TICKER_ITEMS = [
  'NEXT GAME COMING SOON',
  '6 PLAYERS',
  'PLAN A NIGHT TO GET STARTED',
]

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

export function Ticker() {
  const tickerText = '★ ' + TICKER_ITEMS.join(' · ') + ' '
  return (
    <div className="ticker">
      <span className="tk">{tickerText}</span>
      <span className="tk">{tickerText}</span>
    </div>
  )
}
