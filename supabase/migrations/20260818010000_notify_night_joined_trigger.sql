-- Push "X JOINED" to the other players the moment someone joins a night.
-- Mirrors notify_night_planned (20260817305000 + 20260817340000): fired from
-- Postgres so it fires even if the joiner's tab backgrounds right after
-- tapping join, and the net.http_post call is failure-contained from the
-- start so a push outage can never block joining.
--
-- Skips the planner's own auto-join (handlePlan joins them to the night it
-- just created) — those players already got "NEW NIGHT PLANNED" and don't
-- need a second push for the same action.
--
-- Needs the same two Vault secrets as notify_night_planned (see
-- scripts/setup-push.sh stage 7):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');

create function notify_night_joined() returns trigger as $$
begin
  if new.player_id = (select created_by from game_nights where id = new.night_id) then
    return new;
  end if;

  begin
    perform net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notify-night-joined',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := jsonb_build_object('nightId', new.night_id, 'playerId', new.player_id)
    );
  exception when others then
    raise warning 'notify_night_joined: push dispatch failed: %', sqlerrm;
  end;
  return new;
end;
$$ language plpgsql;

create trigger night_player_joined_notify
  after insert on night_players
  for each row execute function notify_night_joined();
