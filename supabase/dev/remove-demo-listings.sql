-- DEV ONLY. Removes the demo account and, through cascades, its listings.
delete from auth.users where id = '00000000-0000-4000-8000-00000000d3e0';
