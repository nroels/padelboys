-- The notify_night_planned / notify_night_joined trigger functions ran with
-- invoker privileges — i.e. as the anon app role doing the insert. anon can't
-- read vault.decrypted_secrets (nor use pg_net), so the secret lookup raised,
-- the exception handler swallowed it as a warning, and no push was ever sent.
-- The game-day-reminder worked because pg_cron runs as postgres.
--
-- security definer makes both functions run as their owner (postgres), which
-- can read Vault and call net.http_post. search_path is pinned as required
-- for security definer functions so a malicious schema can't shadow the
-- vault/net lookups.

alter function notify_night_planned() security definer set search_path = public, extensions, net, vault;
alter function notify_night_joined() security definer set search_path = public, extensions, net, vault;
