-- A night now plays with 4, 5 or 6 players instead of exactly 4. Five and six
-- rotate players through the bench (see src/lib/schedule.js), so the cap moves
-- to the full roster size while 4 stays the minimum needed to fill a court.
-- Only the ceiling is enforced here; the floor is a UI concern (a night with
-- three joiners is simply not shuffleable yet, not an invalid row).

create or replace function enforce_night_player_cap() returns trigger as $$
begin
  perform 1 from game_nights where id = new.night_id for update;
  if (select count(*) from night_players where night_id = new.night_id) >= 6 then
    raise exception 'game night already has 6 players';
  end if;
  return new;
end;
$$ language plpgsql;
