-- Let a planned night record when the court booking ends, not just starts.
alter table game_nights add column ends_at timestamptz;
