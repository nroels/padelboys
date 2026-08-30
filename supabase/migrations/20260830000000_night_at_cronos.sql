-- Cronos is roughly €20/hour cheaper than any other club, so which court a
-- night was booked on is the one fact needed to price what the group saved.
-- This is deliberately the smallest possible version of a location field: a
-- boolean, no club list, no booking integration (see the note in docs/spec.md).
--
-- Default true because Cronos is where the boys book unless someone says
-- otherwise, so the plan form ships with the lever already on.

alter table game_nights add column at_cronos boolean not null default true;

-- Every night played so far was at Cronos except 18/08, which was elsewhere.
update game_nights
  set at_cronos = false
  where starts_at >= timestamptz '2026-08-18 00:00:00+00'
    and starts_at < timestamptz '2026-08-19 00:00:00+00';
