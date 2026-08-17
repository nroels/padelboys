-- Schedule the morning-of-a-game-day reminder push.
--
-- Runs at 06:00 UTC (08:00 CEST / 07:00 CET — close enough to "morning" for a
-- 6-person hobby app; a fixed UTC cron can't perfectly track Brussels DST).
--
-- Needs two one-time Vault secrets, created manually via the SQL editor
-- (never committed): see scripts/setup-push.sh.
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
-- Until those exist, this schedule is harmless: the cron job runs but its
-- net.http_post call fails and is logged, nothing else is affected.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select
  cron.schedule(
    'game-day-reminder',
    '0 6 * * *',
    $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/game-day-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb
    );
    $$
  );
