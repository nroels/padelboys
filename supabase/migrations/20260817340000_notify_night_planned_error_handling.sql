-- The notify_night_planned trigger (20260817305000) had no error handling:
-- if the Vault secrets it depends on aren't set yet, net.http_post can raise
-- (e.g. a null url), which would roll back the game_nights insert — i.e.
-- planning a night would fail because a push notification couldn't be sent.
-- Contain the failure so push dispatch can never block planning a night.
create or replace function notify_night_planned() returns trigger as $$
begin
  begin
    perform net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notify-night-planned',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := jsonb_build_object('nightId', new.id, 'plannerId', new.created_by)
    );
  exception when others then
    raise warning 'notify_night_planned: push dispatch failed: %', sqlerrm;
  end;
  return new;
end;
$$ language plpgsql;
