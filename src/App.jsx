import { useEffect, useState } from 'react'
import Splash from './components/Splash.jsx'
import Header, { Ticker } from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import EmptyView from './components/EmptyView.jsx'
import Onboarding from './components/Onboarding.jsx'
import Account from './components/Account.jsx'
import NextGame from './components/NextGame.jsx'
import Matches from './components/Matches.jsx'
import Log from './components/Log.jsx'
import Ranking from './components/Ranking.jsx'
import Stats from './components/Stats.jsx'
import { supabase } from './lib/supabaseClient.js'
import { getStoredPlayerId, setStoredPlayerId, hasSeenOnboarding, markOnboardingSeen } from './lib/identity.js'
import { isAdmin, isPendingNight, isUpcomingNight, soonestNight } from './lib/nights.js'
import { checkForUpdate } from './lib/swUpdate.js'
import { computeRatings, generateSchedule } from './lib/schedule.js'
import { buildTickerItems, computeRankings } from './lib/stats.js'

function toSet(row) {
  return {
    id: row.id,
    set_index: row.set_index,
    team_a: row.team_a,
    team_b: row.team_b,
    score_a: row.score_a,
    score_b: row.score_b,
  }
}

function toNight(row) {
  return {
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status,
    schedule: row.schedule ?? null,
    playerIds: new Set((row.night_players ?? []).map((np) => np.player_id)),
    sets: (row.sets ?? []).map(toSet).sort((a, b) => a.set_index - b.set_index),
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

function addSet(nights, nightId, set) {
  return nights.map((n) =>
    n.id === nightId && !n.sets.some((s) => s.id === set.id)
      ? { ...n, sets: [...n.sets, set].sort((a, b) => a.set_index - b.set_index) }
      : n,
  )
}

function removeSet(nights, nightId, setId) {
  return nights.map((n) => (n.id === nightId ? { ...n, sets: n.sets.filter((s) => s.id !== setId) } : n))
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

  function loadRoster() {
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
  }

  function loadNights() {
    supabase
      .from('game_nights')
      .select('*, night_players(player_id), sets(*)')
      .order('starts_at')
      .then(({ data, error }) => {
        if (error) {
          console.error('failed to load game nights', error)
          return
        }
        setNights((data ?? []).map(toNight))
      })
  }

  useEffect(() => {
    loadRoster()

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
    loadNights()

    const channel = supabase
      .channel('nights-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_nights' }, (payload) => {
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
          prev.map((n) =>
            n.id === payload.new.id ? { ...n, schedule: payload.new.schedule ?? null, status: payload.new.status } : n,
          ),
        )
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'game_nights' }, (payload) => {
        setNights((prev) => prev.filter((n) => n.id !== payload.old.id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sets' }, (payload) => {
        setNights((prev) => addSet(prev, payload.new.night_id, toSet(payload.new)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'sets' }, (payload) => {
        setNights((prev) => removeSet(prev, payload.old.night_id, payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // iOS suspends the PWA's realtime socket while backgrounded and missed
  // events are never replayed, so the state on screen goes stale. Refetch
  // everything whenever the app returns to the foreground.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState !== 'visible') return
      loadRoster()
      loadNights()
      checkForUpdate()
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [])

  const me = players.find((p) => p.id === playerId) ?? null
  const admin = isAdmin(me)
  const upcomingNights = nights.filter((n) => isUpcomingNight(n))
  const pendingNights = nights.filter((n) => isPendingNight(n))
  const sortedNights = [...upcomingNights].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
  const nextNight = soonestNight(upcomingNights)
  const finishedNightsChronological = [...nights]
    .filter((n) => n.status === 'finished')
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
  const finishedSets = finishedNightsChronological.flatMap((n) => n.sets)
  const ratings = computeRatings(finishedSets)
  const rankings = computeRankings(finishedSets, players.map((p) => p.id))
  const history = [...finishedNightsChronological].reverse()
  const tickerItems = buildTickerItems(rankings, players, nextNight)

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

  async function handleLogSet(nightId, setIndex, teamA, teamB, scoreA, scoreB) {
    const { data, error } = await supabase
      .from('sets')
      .insert({ night_id: nightId, set_index: setIndex, team_a: teamA, team_b: teamB, score_a: scoreA, score_b: scoreB })
      .select()
      .single()
    if (error) {
      console.error('failed to log set', error)
      return false
    }
    setNights((prev) => addSet(prev, nightId, toSet(data)))
    return true
  }

  async function handleDeleteSet(nightId, setId) {
    const { error } = await supabase.from('sets').delete().eq('id', setId)
    if (error) {
      console.error('failed to delete set', error)
      return
    }
    setNights((prev) => removeSet(prev, nightId, setId))
  }

  async function handleFinishNight(nightId) {
    const { error } = await supabase.from('game_nights').update({ status: 'finished' }).eq('id', nightId)
    if (error) {
      console.error('failed to finish night', error)
      return
    }
    setNights((prev) => prev.map((n) => (n.id === nightId ? { ...n, status: 'finished' } : n)))
  }

  async function handleDeleteNight(nightId) {
    const { error } = await supabase.from('game_nights').delete().eq('id', nightId)
    if (error) {
      console.error('failed to delete game night', error)
      return
    }
    setNights((prev) => prev.filter((n) => n.id !== nightId))
  }

  // Admin-only backfill: creates a finished night directly, skipping the
  // normal plan → join → schedule flow entirely.
  async function handleAddHistory(startsAt, sets) {
    const { data: night, error } = await supabase
      .from('game_nights')
      .insert({ starts_at: startsAt.toISOString(), status: 'finished', created_by: playerId })
      .select()
      .single()
    if (error) {
      console.error('failed to backfill game night', error)
      return false
    }
    setNights((prev) => (prev.some((n) => n.id === night.id) ? prev : [...prev, toNight(night)]))

    const rows = sets.map((s, i) => ({
      night_id: night.id,
      set_index: i,
      team_a: s.teamA,
      team_b: s.teamB,
      score_a: s.scoreA,
      score_b: s.scoreB,
    }))
    const { data: setRows, error: setsError } = await supabase.from('sets').insert(rows).select()
    if (setsError) {
      console.error('failed to backfill sets', setsError)
      return false
    }
    setNights((prev) => setRows.reduce((acc, row) => addSet(acc, night.id, toSet(row)), prev))
    return true
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
    home: (
      <>
        {nextNight ? (
          <NextGame
            night={nextNight}
            players={players}
            ratings={ratings}
            onShuffle={handleShuffle}
            shuffleToken={shuffleToken?.nightId === nextNight.id ? shuffleToken.token : null}
          />
        ) : (
          <EmptyView title="NO NEXT GAME YET" note="plan one via the matches tab" />
        )}
        {rankings.length > 0 && <Ranking rankings={rankings} players={players} />}
      </>
    ),
    matches: (
      <Matches
        nights={sortedNights}
        history={history}
        players={players}
        me={me}
        isAdmin={admin}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onPlan={handlePlan}
        onDeleteNight={handleDeleteNight}
        onAddHistory={handleAddHistory}
      />
    ),
    log: (
      <Log
        nights={pendingNights}
        allNights={nights}
        players={players}
        isAdmin={admin}
        onLogSet={handleLogSet}
        onDeleteSet={handleDeleteSet}
        onFinishNight={handleFinishNight}
        onDeleteNight={handleDeleteNight}
      />
    ),
    stats:
      finishedSets.length > 0 ? (
        <Stats sets={finishedSets} players={players} rankings={rankings} />
      ) : (
        <EmptyView title="NO STATS YET" note="play a few sets to unlock rankings" />
      ),
    account: <Account me={me} onRename={handleRename} onSwitchPlayer={() => setShowWhoPicker(true)} />,
  }

  return (
    <>
      {!started && <Splash onStart={() => setStarted(true)} />}
      <div className="phone">
        <div className="stars s1"></div>
        <div className="stars s2"></div>
        <Header />
        <Ticker items={tickerItems} />
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
