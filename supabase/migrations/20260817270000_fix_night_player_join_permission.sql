-- The night_player_cap trigger takes `select ... for update` on game_nights
-- to serialize concurrent joins onto the same night. Postgres requires
-- UPDATE (or DELETE) privilege to acquire that row lock even though the
-- trigger never writes to the row — SELECT privilege alone isn't enough.
-- Without it, every insert into night_players (i.e. every join, including a
-- planner auto-joining their own new night) fails with
-- "permission denied for table game_nights" (42501).
grant update on game_nights to anon, authenticated;
