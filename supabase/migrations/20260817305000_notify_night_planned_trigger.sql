-- Push "NEW NIGHT PLANNED" to the other 5 the moment a night is inserted.
-- Fired from Postgres (not the client) so the notification still goes out
-- even if the planner's tab backgrounds or closes right after tapping plan.
--
-- Needs the same two one-time Vault secrets as the game-day-reminder cron
-- (see the 20260817310000 migration and scripts/setup-push.sh):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
-- Until those exist, planning a night still works — only the net.http_post
-- call fails, and it's logged, nothing else is affected.

create extension if not exists pg_net with schema extensions;

create function notify_night_planned() returns trigger as $$
begin
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notify-night-planned',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := jsonb_build_object('nightId', new.id, 'plannerId', new.created_by)
  );
  return new;
end;
$$ language plpgsql;

create trigger game_night_planned_notify
  after insert on game_nights
  for each row execute function notify_night_planned();
