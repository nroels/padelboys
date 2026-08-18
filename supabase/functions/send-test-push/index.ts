// Manual debug tool: push a test notification to one player's devices, so we
// can confirm delivery without waiting on a real game-night or reminder event.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendWebPush } from '../_shared/push.ts'

Deno.serve(async (req) => {
  const { playerId } = await req.json()
  if (!playerId) {
    return new Response('playerId is required', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('player_id', playerId)
  if (subsError) {
    console.error('failed to load subscriptions', subsError)
    return new Response('failed to load subscriptions', { status: 500 })
  }
  if (!subs || subs.length === 0) {
    return new Response('no subscriptions for that player', { status: 404 })
  }

  const payload = { title: 'TEST PUSH', body: 'if you see this, notifications work', url: '/' }

  const expiredIds: string[] = []
  const results = await Promise.all(
    subs.map(async (sub) => {
      const result = await sendWebPush(sub, payload)
      if (result.expired) expiredIds.push(sub.id)
      return { id: sub.id, ...result }
    }),
  )

  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return new Response(JSON.stringify({ sent: results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
