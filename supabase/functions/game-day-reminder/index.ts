// Invoked daily by pg_cron (see the 20260817310000 migration). Pushes a
// reminder to every joined player of every night happening today.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendWebPush } from '../_shared/push.ts'
import { isTodayInBrussels } from '../_shared/format.ts'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: nights, error: nightsError } = await supabase
    .from('game_nights')
    .select('id, starts_at, night_players(player_id)')
    .eq('status', 'upcoming')
  if (nightsError) {
    console.error('failed to load game nights', nightsError)
    return new Response('failed to load game nights', { status: 500 })
  }

  const now = new Date()
  const todays = (nights ?? []).filter((n) => isTodayInBrussels(n.starts_at, now))

  const expiredIds: string[] = []
  for (const night of todays) {
    const playerIds = (night.night_players ?? []).map((np) => np.player_id)
    if (playerIds.length === 0) continue

    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .in('player_id', playerIds)
    if (subsError) {
      console.error('failed to load subscriptions', subsError)
      continue
    }

    const payload = { title: 'GAME NIGHT TODAY', body: "tonight's the night — see you there", url: '/' }
    await Promise.all(
      (subs ?? []).map(async (sub) => {
        const result = await sendWebPush(sub, payload)
        if (result.expired) expiredIds.push(sub.id)
      }),
    )
  }

  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return new Response('ok')
})
