-- Roster grows from 6 to 7: Dario joins the group.
-- Nothing in the app assumes a roster size (App.jsx reads every player ordered
-- by sort_order, and a night still caps at 4 joiners), so this is insert-only.
-- sort_order 6 keeps admin with sort_order 0 (see lib/nights.js isAdmin).
-- species/accent match the "human + shirt color" default the avatar migration
-- gave everyone else; Dario can change both from the Account screen.

insert into players (name, hair, skin, shirt, sort_order, species, accent)
values ('DARIO', '#6a4a2a', '#f0c8a0', '#ffd23a', 6, 'human', '#ffd23a');
