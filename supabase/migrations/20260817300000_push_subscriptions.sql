-- Per-device web push subscriptions. Same trust model as the rest: no auth,
-- RLS open to the friend group, keys never readable by anon.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "anyone can subscribe a device" on push_subscriptions
  for insert
  with check (true);

create policy "anyone can update its own subscription row" on push_subscriptions
  for update
  using (true)
  with check (true);

create policy "anyone can remove a device subscription" on push_subscriptions
  for delete
  using (true);

revoke all on push_subscriptions from anon, authenticated;
grant insert, delete on push_subscriptions to anon, authenticated;
grant update (player_id) on push_subscriptions to anon, authenticated;
-- update is column-scoped to player_id only (re-subscribing an existing
-- endpoint under a different chosen player): a device must never be able to
-- rewrite another device's endpoint/p256dh/auth and hijack its notifications.
-- No select grant: the client already knows its own subscription state from
-- the browser's PushManager, and endpoints/keys are only ever read by the
-- edge functions via the service role key, which bypasses RLS.
