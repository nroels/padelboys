-- Custom avatars (#10): pixel character species + one colorable accent band,
-- replacing the "custom avatars" ticket (#8) that would have needed photo upload.
-- Existing players default to 'human' + their current shirt color so nobody's
-- avatar changes on migration; they can pick a species/accent afterward.

alter table players add column species text;
alter table players add column accent text;

update players set species = 'human', accent = shirt;

alter table players alter column species set not null;
alter table players alter column accent set not null;

alter table players add constraint players_species_check
  check (species in ('human', 'bear', 'penguin', 'bird', 'panda'));

alter table players add constraint players_accent_check
  check (accent in (
    '#ffb03a', '#ff4d8d', '#7fd4e8', '#0f7f74',
    '#b18ad1', '#ffe9cf', '#ffd23a', '#8a5ad8'
  ));

grant update (species, accent) on players to anon, authenticated;
