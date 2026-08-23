-- Track game nights created from a Cronos padel court booking (SharePoint
-- Reservations list, synced via a Power Automate flow), so they can be
-- upserted idempotently by sharepoint_item_id instead of duplicated on
-- every flow retry.
alter table game_nights add column court text;
alter table game_nights add column source text not null default 'manual'
  check (source in ('manual', 'sharepoint'));
alter table game_nights add column sharepoint_item_id integer unique;
