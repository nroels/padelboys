-- The Cronos booking integration was dropped before it shipped: no flow was
-- ever wired up, no night ever carried a court or a sharepoint_item_id, and
-- the sharepoint-booking edge function is deleted. Nights are planned in the
-- app and nowhere else, so the columns go with it.
--
-- `if exists` because 20260818040000 was only ever applied to the live project
-- and never committed — a database built from this repo alone never had them.

alter table game_nights drop column if exists sharepoint_item_id;
alter table game_nights drop column if exists source;
alter table game_nights drop column if exists court;
