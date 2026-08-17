import { useState } from 'react'
import Splash from './components/Splash.jsx'
import Header, { Ticker } from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import EmptyView from './components/EmptyView.jsx'

const VIEWS = {
  home: <EmptyView title="NO NEXT GAME YET" note="plan one via the matches tab" />,
  matches: <EmptyView title="NO GAMES PLANNED" note="pick a day below to get started" />,
  log: <EmptyView title="NO GAMES TO SCORE" note="finish a night to log its sets here" />,
  stats: <EmptyView title="NO STATS YET" note="play a few sets to unlock rankings" />,
  account: <EmptyView title="WHO ARE YOU?" note="player identity is coming soon" />,
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [view, setView] = useState('home')

  return (
    <>
      {!started && <Splash onStart={() => setStarted(true)} />}
      <div className="phone">
        <div className="stars s1"></div>
        <div className="stars s2"></div>
        <Header />
        <Ticker />
        {Object.entries(VIEWS).map(([id, content]) => (
          <div key={id} className={`view ${view === id ? 'on' : ''}`}>{content}</div>
        ))}
        <BottomNav active={view} onChange={setView} />
      </div>
    </>
  )
}
