-- Let the roster's admin correct a planned night's time (e.g. a booking typo)
-- from the app. Same open trust model as every other admin action here: RLS
-- stays open to the friend group, the UI is what actually gates who sees the
-- control (see delete_game_night.sql).

grant update (starts_at, ends_at) on game_nights to anon, authenticated;
