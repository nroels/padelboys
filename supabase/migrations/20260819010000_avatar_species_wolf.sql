-- Add 'wolf' to the avatar species whitelist (see 20260818030000_avatar_species.sql).

alter table players drop constraint players_species_check;

alter table players add constraint players_species_check
  check (species in ('human', 'bear', 'penguin', 'bird', 'panda', 'wolf'));
