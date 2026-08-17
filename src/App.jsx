import { useEffect, useState } from 'react'
import Splash from './components/Splash.jsx'
import Header, { Ticker } from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import EmptyView from './components/EmptyView.jsx'
import Onboarding from './components/Onboarding.jsx'
import Account from './components/Account.jsx'
import { supabase } from './lib/supabaseClient.js'
import { getStoredPlayerId, setStoredPlayerId, hasSeenOnboarding, markOnboardingSeen } from './lib/identity.js'

export default function App() {
  const [started, setStarted] = useState(false)
  const [view, setView] = useState('home')
  const [players, setPlayers] = useState([])
  const [playerId, setPlayerId] = useState(() => getStoredPlayerId())
  const [pwaHintSeen, setPwaHintSeen] = useState(() => hasSeenOnboarding())
  const [showWhoPicker, setShowWhoPicker] = useState(false)

  useEffect(() => {
    supabase
      .from('players')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) {
          console.error('failed to load roster', error)
          return
        }
        setPlayers(data ?? [])
      })

    const channel = supabase
      .channel('players-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, (payload) => {
        setPlayers((prev) => prev.map((p) => (p.id === payload.new.id ? payload.new : p)))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const me = players.find((p) => p.id === playerId) ?? null

  function handlePwaContinue() {
    markOnboardingSeen()
    setPwaHintSeen(true)
  }

  function handlePick(id) {
    setStoredPlayerId(id)
    setPlayerId(id)
    setShowWhoPicker(false)
  }

  async function handleRename(name) {
    const { error } = await supabase.from('players').update({ name }).eq('id', me.id)
    if (error) return false
    setPlayers((prev) => prev.map((p) => (p.id === me.id ? { ...p, name } : p)))
    return true
  }

  const onboardingStage = !started
    ? null
    : !pwaHintSeen
      ? 'pwa'
      : !playerId || showWhoPicker
        ? 'who'
        : null

  const VIEWS = {
    home: <EmptyView title="NO NEXT GAME YET" note="plan one via the matches tab" />,
    matches: <EmptyView title="NO GAMES PLANNED" note="pick a day below to get started" />,
    log: <EmptyView title="NO GAMES TO SCORE" note="finish a night to log its sets here" />,
    stats: <EmptyView title="NO STATS YET" note="play a few sets to unlock rankings" />,
    account: <Account me={me} onRename={handleRename} onSwitchPlayer={() => setShowWhoPicker(true)} />,
  }

  return (
    <>
      {!started && <Splash onStart={() => setStarted(true)} />}
      <div className="phone">
        <div className="stars s1"></div>
        <div className="stars s2"></div>
        <Header />
        <Ticker />
        {onboardingStage && (
          <Onboarding
            stage={onboardingStage}
            players={players}
            onPwaContinue={handlePwaContinue}
            onPick={handlePick}
          />
        )}
        {Object.entries(VIEWS).map(([id, content]) => (
          <div key={id} className={`view ${view === id ? 'on' : ''}`}>
            {content}
          </div>
        ))}
        <BottomNav active={view} onChange={setView} />
      </div>
    </>
  )
}
