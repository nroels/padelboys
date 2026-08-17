import { useEffect, useState } from 'react'
import Splash from './components/Splash.jsx'
import Header, { Ticker } from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import EmptyView from './components/EmptyView.jsx'
import Onboarding from './components/Onboarding.jsx'
import Account from './components/Account.jsx'
import NextGame from './components/NextGame.jsx'
import Matches from './components/Matches.jsx'
import { supabase } from './lib/supabaseClient.js'
import { getStoredPlayerId, setStoredPlayerId, hasSeenOnboarding, markOnboardingSeen } from './lib/identity.js'
import { soonestNight } from './lib/nights.js'
import { generateSchedule } from './lib/schedule.js'

function toNight(row) {
  return {
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status,
    schedule: row.schedule ?? null,
    playerIds: new Set((row.night_players ?? []).map((np) => np.player_id)),
  }
}

function addJoin(nights, nightId, joinedPlayerId) {
  return nights.map((n) =>
    n.id === nightId ? { ...n, playerIds: new Set(n.playerIds).add(joinedPlayerId), schedule: null } : n,
  )
}

function removeJoin(nights, nightId, leftPlayerId) {
  return nights.map((n) => {
    if (n.id !== nightId) return n
    const playerIds = new Set(n.playerIds)
    playerIds.delete(leftPlayerId)
    return { ...n, playerIds, schedule: null }
  })
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [view, setView] = useState('home')
  const [players, setPlayers] = useState([])
  const [nights, setNights] = useState([])
  const [playerId, setPlayerId] = useState(() => getStoredPlayerId())
  const [pwaHintSeen, setPwaHintSeen] = useState(() => hasSeenOnboarding())
  const [showWhoPicker, setShowWhoPicker] = useState(false)
  const [shuffleToken, setShuffleToken] = useState(null)

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

  useEffect(() => {
    supabase
      .from('game_nights')
      .select('*, night_players(player_id)')
      .eq('status', 'upcoming')
      .order('starts_at')
      .then(({ data, error }) => {
        if (error) {
          console.error('failed to load game nights', error)
          return
        }
        setNights((data ?? []).map(toNight))
      })

    const channel = supabase
      .channel('nights-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_nights' }, (payload) => {
        if (payload.new.status !== 'upcoming') return
        setNights((prev) =>
          prev.some((n) => n.id === payload.new.id) ? prev : [...prev, toNight(payload.new)],
        )
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'night_players' }, (payload) => {
        setNights((prev) => addJoin(prev, payload.new.night_id, payload.new.player_id))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'night_players' }, (payload) => {
        setNights((prev) => removeJoin(prev, payload.old.night_id, payload.old.player_id))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_nights' }, (payload) => {
        setNights((prev) =>
          prev.map((n) => (n.id === payload.new.id ? { ...n, schedule: payload.new.schedule ?? null } : n)),
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const me = players.find((p) => p.id === playerId) ?? null
  const sortedNights = [...nights].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
  const nextNight = soonestNight(nights)

  async function handleJoin(nightId) {
    if (!playerId) return
    const { error } = await supabase.from('night_players').insert({ night_id: nightId, player_id: playerId })
    if (error) {
      console.error('failed to join night', error)
      return
    }
    setNights((prev) => addJoin(prev, nightId, playerId))
  }

  async function handleLeave(nightId) {
    if (!playerId) return
    const { error } = await supabase
      .from('night_players')
      .delete()
      .eq('night_id', nightId)
      .eq('player_id', playerId)
    if (error) {
      console.error('failed to leave night', error)
      return
    }
    setNights((prev) => removeJoin(prev, nightId, playerId))
  }

  async function handleShuffle(night) {
    const schedule = generateSchedule([...night.playerIds])
    setNights((prev) => prev.map((n) => (n.id === night.id ? { ...n, schedule } : n)))
    setShuffleToken((prev) => ({ nightId: night.id, token: (prev?.token ?? 0) + 1 }))
    const { error } = await supabase.from('game_nights').update({ schedule }).eq('id', night.id)
    if (error) console.error('failed to shuffle night', error)
  }

  async function handlePlan(startsAt, endsAt) {
    const { data, error } = await supabase
      .from('game_nights')
      .insert({ starts_at: startsAt.toISOString(), ends_at: endsAt?.toISOString() ?? null, created_by: playerId })
      .select()
      .single()
    if (error) {
      console.error('failed to plan game night', error)
      return
    }
    setNights((prev) => (prev.some((n) => n.id === data.id) ? prev : [...prev, toNight(data)]))
    if (playerId) {
      setNights((prev) => addJoin(prev, data.id, playerId))
      const { error: joinError } = await supabase
        .from('night_players')
        .insert({ night_id: data.id, player_id: playerId })
      if (joinError) console.error('failed to join own game night', joinError)
    }
  }

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
    home: nextNight ? (
      <NextGame
        night={nextNight}
        players={players}
        onShuffle={handleShuffle}
        shuffleToken={shuffleToken?.nightId === nextNight.id ? shuffleToken.token : null}
      />
    ) : (
      <EmptyView title="NO NEXT GAME YET" note="plan one via the matches tab" />
    ),
    matches: (
      <Matches
        nights={sortedNights}
        players={players}
        me={me}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onPlan={handlePlan}
      />
    ),
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
