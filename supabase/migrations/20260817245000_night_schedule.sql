-- Shuffle night schedule: 3 team splits stored on the night, synced live.
-- Roster changes reset it in Postgres (not only the UI) so a stale schedule
-- can never reference a player who left.

alter table game_nights add column schedule jsonb;

create policy "anyone can shuffle the schedule" on game_nights
  for update
  using (true)
  with check (true);

grant update (schedule) on game_nights to anon, authenticated;

create function reset_night_schedule() returns trigger as $$
begin
  update game_nights
    set schedule = null
    where id = coalesce(new.night_id, old.night_id) and schedule is not null;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger night_roster_resets_schedule
  after insert or delete on night_players
  for each row execute function reset_night_schedule();
