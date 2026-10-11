-- DEV ONLY. Loads demo listings owned by a demo account that cannot sign in.
-- Run:    npx supabase db query --linked -f supabase/dev/demo-listings.sql
-- Remove: npx supabase db query --linked -f supabase/dev/remove-demo-listings.sql
-- Photos are placeholder URLs; real listings store Supabase Storage paths.

do $$
declare
  demo_id constant uuid := '00000000-0000-4000-8000-00000000d3e0';
  school uuid := (select id from public.schools where slug = 'rutgers-nb');
  l record;
  new_id uuid;
begin
  if not exists (select 1 from auth.users where id = demo_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
      email_confirmed_at, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', demo_id, 'authenticated', 'authenticated',
      'demo-listings@example.invalid', '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo listings"}', now(), now(), now()
    );
  end if;

  -- Re-running replaces the demo set.
  delete from public.listings where owner_id = demo_id;

  for l in
    select * from (values
      ('Shared room in 2BR',        'shared_room'::public.room_type,  'in 2BR',        'Mine St',          'College Ave area', 560,  '2027-06-01'::date, '2027-08-10'::date, 2, 1.0, 'active'::public.listing_status, 0, '12 Mine St, New Brunswick, NJ',            40.5003, -74.4519, 'ru-mine-shared',     array['furnished']),
      ('Private room in 2BR',       'private_room',                   'in 2BR',        'George St',        'Douglass',         690,  '2027-09-01',       '2027-12-23',       2, 1.0, 'active',                        2, '410 George St, New Brunswick, NJ',         40.4842, -74.4402, 'ru-george-room',     array['laundry','utilities-included']),
      ('Private room in 3BR',       'private_room',                   'in 3BR',        'Easton Ave',       'Easton Ave',       825,  '2027-05-15',       '2027-08-20',       3, 1.0, 'active',                        1, '95 Easton Ave, New Brunswick, NJ',         40.4979, -74.4489, 'ru-easton-bedroom',  array['furnished','laundry']),
      ('Private room in 3BR apt',   'private_room',                   'in 3BR apt',    'Davidson Rd',      'Busch',            780,  '2027-05-20',       '2027-08-25',       3, 2.0, 'active',                        4, '200 Davidson Rd, Piscataway, NJ',          40.5196, -74.4621, 'ru-busch-apartment', array['parking','gym']),
      ('Entire 2BR',                'entire_place',                   '2BR',           'Joyce Kilmer Ave', 'Livingston',       1680, '2027-01-15',       '2027-05-15',       2, 1.0, 'active',                        6, '600 Joyce Kilmer Ave, Piscataway, NJ',     40.5212, -74.4329, 'ru-livingston-2br',  array['furnished','dishwasher']),
      ('Entire 1BR',                'entire_place',                   '1BR',           'Hamilton St',      'Hamilton St',      1250, '2027-06-01',       '2027-08-15',       1, 1.0, 'active',                        3, '150 Hamilton St, New Brunswick, NJ',       40.4994, -74.4536, 'ru-hamilton-living', array['utilities-included','ac']),
      ('Studio',                    'studio',                         null,            'Somerset St',      'Somerset St',      1100, '2027-05-20',       '2027-08-31',       1, 1.0, 'active',                        2, '75 Somerset St, New Brunswick, NJ',        40.4968, -74.4527, 'ru-somerset-studio', array['ac','parking']),
      ('Private room in 4BR house', 'private_room',                   'in 4BR house',  'Raritan Ave',      'Highland Park',    700,  '2027-05-15',       '2027-08-31',       4, 2.0, 'active',                        5, '300 Raritan Ave, Highland Park, NJ',       40.4957, -74.4243, 'ru-highland-house',  array['backyard','pets-ok']),
      ('Private room in 5BR',       'private_room',                   'in 5BR',        'Easton Ave',       'Easton Ave',       790,  '2027-05-15',       '2027-08-15',       5, 2.0, 'taken',                         9, '120 Easton Ave, New Brunswick, NJ',        40.4988, -74.4501, 'ru-easton-5br',      array['furnished'])
    ) as t (title, room_type, unit_label, street_name, neighborhood, price, starts_on, ends_on, beds, baths, status, days_ago, address, lat, lng, photo_seed, amenities)
  loop
    insert into public.listings (
      owner_id, school_id, title, price_monthly, starts_on, ends_on, room_type, unit_label,
      beds, baths, neighborhood, street_name, status, created_at,
      description
    ) values (
      demo_id, school, l.title, l.price, l.starts_on, l.ends_on, l.room_type, l.unit_label,
      l.beds, l.baths, l.neighborhood, l.street_name, l.status, now() - make_interval(days => l.days_ago),
      'Demo listing for development. Not a real place.' || chr(10) || chr(10) ||
      'Sunny room on a quiet stretch, a short walk from campus and the bus stop. ' ||
      'Shared kitchen and living room with two easygoing roommates. ' ||
      'Rent covers the room; split utilities run about $60 a month.'
    ) returning id into new_id;

    insert into public.listing_locations (listing_id, address, location)
    values (new_id, l.address,
      extensions.st_setsrid(extensions.st_makepoint(l.lng, l.lat), 4326)::extensions.geography);

    -- 3 to 5 placeholder photos per listing, so the gallery has something to show.
    insert into public.listing_photos (listing_id, storage_path, position)
    select new_id,
      'https://picsum.photos/seed/' || l.photo_seed || case when n = 0 then '' else '-' || n end || '/1200/900',
      n
    from generate_series(0, 2 + (length(l.photo_seed) % 3)) as n;

    insert into public.listing_amenities (listing_id, amenity_slug)
    select new_id, unnest(l.amenities);
  end loop;
end;
$$;
