-- Reference data for launch: Rutgers New Brunswick, its campuses, upcoming
-- semesters, and the amenity list. Kept in a migration (not seed.sql) so it
-- reaches the hosted database on `supabase db push`.

insert into public.schools (slug, name, email_domain, center)
values (
  'rutgers-nb',
  'Rutgers New Brunswick',
  'rutgers.edu',
  extensions.st_setsrid(extensions.st_makepoint(-74.4474, 40.5008), 4326)::extensions.geography
)
on conflict (slug) do nothing;

insert into public.campuses (school_id, slug, name, location)
select s.id, v.slug, v.name,
  extensions.st_setsrid(extensions.st_makepoint(v.lng, v.lat), 4326)::extensions.geography
from public.schools s
cross join (values
  ('college-ave', 'College Ave', 40.5008, -74.4474),
  ('busch', 'Busch', 40.5232, -74.4582),
  ('livingston', 'Livingston', 40.5245, -74.4369),
  ('cook-douglass', 'Cook/Douglass', 40.4806, -74.4366)
) as v (slug, name, lat, lng)
where s.slug = 'rutgers-nb'
on conflict (school_id, slug) do nothing;

-- Approximate term spans for sublet presets. Adjust to the official academic
-- calendar before launch.
insert into public.semesters (school_id, slug, label, starts_on, ends_on)
select s.id, v.slug, v.label, v.starts_on::date, v.ends_on::date
from public.schools s
cross join (values
  ('spring-2027', 'Spring 2027', '2027-01-15', '2027-05-15'),
  ('summer-2027', 'Summer 2027', '2027-05-15', '2027-08-31'),
  ('fall-2027', 'Fall 2027', '2027-09-01', '2027-12-23')
) as v (slug, label, starts_on, ends_on)
where s.slug = 'rutgers-nb'
on conflict (school_id, slug) do nothing;

insert into public.amenities (slug, label, sort_order) values
  ('furnished', 'Furnished', 10),
  ('laundry', 'Laundry', 20),
  ('utilities-included', 'Utilities incl.', 30),
  ('ac', 'AC', 40),
  ('parking', 'Parking', 50),
  ('pets-ok', 'Pets OK', 60),
  ('wifi', 'Wi-Fi', 70),
  ('dishwasher', 'Dishwasher', 80),
  ('gym', 'Gym', 90),
  ('backyard', 'Backyard', 100)
on conflict (slug) do nothing;
