// Thin wrapper around the `web-push` npm package for sending a single Web
// Push message. Shared by every edge function that pushes to a device.
import webpush from 'npm:web-push@3.6.7'

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:padelboys@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

export interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushPayload {
  title: string
  body: string
  url: string
}

// Sends the push and reports whether the subscription is gone (404/410) so
// callers can clean up push_subscriptions without duplicating status checks.
export async function sendWebPush(
  sub: PushSubscriptionRow,
  payload: PushPayload,
): Promise<{ ok: boolean; expired: boolean }> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    )
    return { ok: true, expired: false }
  } catch (err) {
    const status = err?.statusCode
    if (status === 404 || status === 410) return { ok: false, expired: true }
    console.error('push failed', sub.id, err)
    return { ok: false, expired: false }
  }
}
