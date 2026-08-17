-- Logged set scores for a game night. Stats are always derived by replaying
-- this log (never denormalized onto players), so delete+relog is trivially
-- correct. Same open trust model as the rest of the app.

create table sets (
  id uuid primary key default gen_random_uuid(),
  night_id uuid not null references game_nights(id) on delete cascade,
  set_index smallint not null,
  team_a uuid[] not null,
  team_b uuid[] not null,
  score_a smallint not null check (score_a between 0 and 7),
  score_b smallint not null check (score_b between 0 and 7),
  created_at timestamptz not null default now(),
  check (score_a <> score_b),
  check (array_length(team_a, 1) = 2 and array_length(team_b, 1) = 2),
  unique (night_id, set_index)
);

alter table sets enable row level security;

create policy "anyone can read sets" on sets
  for select
  using (true);

create policy "anyone can log a set" on sets
  for insert
  with check (true);

create policy "anyone can delete a set" on sets
  for delete
  using (true);

revoke all on sets from anon, authenticated;
grant select, insert, delete on sets to anon, authenticated;

alter publication supabase_realtime add table sets;

-- Finishing a night is an explicit action (moves it out of the log tab).
-- RLS is row-level; the existing "anyone can shuffle the schedule" update
-- policy already covers this row, so only the column grant is needed.
grant update (status) on game_nights to anon, authenticated;
