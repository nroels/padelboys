-- Game nights: planning and joining, capped at 4 players per night.
-- Same trust model as players: no auth, RLS open to the friend group, but the
-- cap is enforced here in Postgres (a trigger), not only in the UI.

create table game_nights (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'pending', 'finished')),
  created_at timestamptz not null default now()
);

create table night_players (
  night_id uuid not null references game_nights(id) on delete cascade,
  player_id uuid not null references players(id),
  joined_at timestamptz not null default now(),
  primary key (night_id, player_id)
);

alter table game_nights enable row level security;
alter table night_players enable row level security;

create policy "anyone can read game nights" on game_nights
  for select
  using (true);

create policy "anyone can plan a game night" on game_nights
  for insert
  with check (true);

create policy "anyone can read joins" on night_players
  for select
  using (true);

create policy "anyone can join a game night" on night_players
  for insert
  with check (true);

create policy "anyone can leave a game night" on night_players
  for delete
  using (true);

revoke all on game_nights from anon, authenticated;
grant select, insert on game_nights to anon, authenticated;

revoke all on night_players from anon, authenticated;
grant select, insert, delete on night_players to anon, authenticated;

-- Reject a 5th joiner even if two clients race to insert at once: lock the
-- parent night row first so concurrent inserts for the same night serialize.
create function enforce_night_player_cap() returns trigger as $$
begin
  perform 1 from game_nights where id = new.night_id for update;
  if (select count(*) from night_players where night_id = new.night_id) >= 4 then
    raise exception 'game night already has 4 players';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger night_player_cap
  before insert on night_players
  for each row execute function enforce_night_player_cap();

alter publication supabase_realtime add table game_nights;
alter publication supabase_realtime add table night_players;
