-- Deleting a whole game night wasn't possible at all before (no delete grant
-- existed on game_nights). Adding it here keeps the same open trust model as
-- every other table: who actually sees the delete control is a UI-only call
-- (the roster's admin), not a database-level rule.

create policy "anyone can delete a game night" on game_nights
  for delete
  using (true);

grant delete on game_nights to anon, authenticated;
