// Invoked by the client right after a game night is inserted. Pushes to
// every subscribed device except the planner's own.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendWebPush } from '../_shared/push.ts'
import { formatNightWhen } from '../_shared/format.ts'

Deno.serve(async (req) => {
  const { nightId, plannerId } = await req.json()
  if (!nightId || !plannerId) {
    return new Response('nightId and plannerId are required', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: night, error: nightError } = await supabase
    .from('game_nights')
    .select('starts_at')
    .eq('id', nightId)
    .single()
  if (nightError || !night) {
    return new Response('night not found', { status: 404 })
  }

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .neq('player_id', plannerId)
  if (subsError) {
    console.error('failed to load subscriptions', subsError)
    return new Response('failed to load subscriptions', { status: 500 })
  }

  const payload = {
    title: 'NEW NIGHT PLANNED',
    body: formatNightWhen(night.starts_at),
    url: '/',
  }

  const expiredIds: string[] = []
  await Promise.all(
    (subs ?? []).map(async (sub) => {
      const result = await sendWebPush(sub, payload)
      if (result.expired) expiredIds.push(sub.id)
    }),
  )

  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return new Response('ok')
})
