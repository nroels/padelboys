import { supabase } from './supabaseClient.js'

// Web Push requires the VAPID public key as a raw Uint8Array, but it's
// distributed as a URL-safe base64 string.
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export async function getPushSubscription() {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function subscribeToPush(playerId) {
  const registration = await navigator.serviceWorker.ready
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('notification permission denied')
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  })

  const { endpoint, keys } = subscription.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .insert({ player_id: playerId, endpoint, p256dh: keys.p256dh, auth: keys.auth })

  if (error) {
    // 23505 = unique_violation: this endpoint is already subscribed (e.g. the
    // device switched player) — only player_id may legitimately change here,
    // per the column-scoped update grant in the push_subscriptions migration.
    if (error.code === '23505') {
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({ player_id: playerId })
        .eq('endpoint', endpoint)
      if (updateError) {
        await subscription.unsubscribe()
        throw updateError
      }
    } else {
      await subscription.unsubscribe()
      throw error
    }
  }

  return subscription
}

export async function unsubscribeFromPush() {
  const subscription = await getPushSubscription()
  if (!subscription) return

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', subscription.endpoint)
  if (error) throw error

  await subscription.unsubscribe()
}
