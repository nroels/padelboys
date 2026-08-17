-- Swap placeholder roster names for the real ones, in place (keeps ids/avatars).
update players set name = 'COLIN'  where name = 'JEF';
update players set name = 'KEYAN'  where name = 'WOUT';
update players set name = 'STIEVE' where name = 'SIEN';
update players set name = 'ADRIAN' where name = 'LARS';
update players set name = 'PJ'     where name = 'TIBO';
