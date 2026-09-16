-- Roster shrinks from 7 back to 6: Dario leaves the group.
-- Mirrors 20260819000000_add_player_dario.sql. Checked before writing this:
-- he never joined a night (night_players), never planned one (created_by)
-- and appears in no logged set (team_a/team_b), so nothing else references
-- the row. push_subscriptions cascades on delete. Deleting by id rather than
-- name so a later player with the same name is never caught by a re-run.

delete from players where id = '7ec1cb3b-3ae6-4727-bcd8-66579ed15a7a';
