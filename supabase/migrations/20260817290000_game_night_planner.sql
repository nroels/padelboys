-- Record who planned a night, so the "night planned" push can exclude them.
alter table game_nights add column created_by uuid references players(id);
