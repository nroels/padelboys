-- Fixed 6-player roster + device identity.
-- No auth: anon key is trusted by the friend group, so RLS is deny-by-default
-- and only opens exactly what the app needs (read roster, rename self).

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name ~ '^[A-Z0-9]{1,6}$'),
  hair text not null,
  skin text not null,
  shirt text not null,
  sort_order smallint not null unique,
  created_at timestamptz not null default now()
);

alter table players enable row level security;

create policy "anyone can read the roster" on players
  for select
  using (true);

create policy "anyone can rename a player" on players
  for update
  using (true)
  with check (true);

revoke all on players from anon, authenticated;
grant select on players to anon, authenticated;
grant update (name) on players to anon, authenticated;

insert into players (name, hair, skin, shirt, sort_order) values
  ('NICK',   '#3a2a1d', '#e0a878', '#ffb03a', 0),
  ('COLIN',  '#e8c84a', '#f0c8a0', '#0f7f74', 1),
  ('KEYAN',  '#181818', '#c88a5a', '#ff4d8d', 2),
  ('STIEVE', '#8a3a1d', '#e0a878', '#7fd4e8', 3),
  ('ADRIAN', '#c8c8c8', '#f0c8a0', '#ffe9cf', 4),
  ('PJ',     '#5a3a8a', '#c88a5a', '#8a5ad8', 5);

alter publication supabase_realtime add table players;
