-- This project does not auto-grant new tables to the API roles, so grant
-- table privileges explicitly. Row Level Security still decides which rows
-- each role can see or change.

grant usage on schema public to anon, authenticated;

-- Public reads
grant select on public.schools, public.campuses, public.semesters, public.amenities
  to anon, authenticated;
grant select on public.profiles, public.listings, public.listing_photos, public.listing_amenities
  to anon, authenticated;

-- Signed-in users
grant update on public.profiles to authenticated;
grant select, update on public.profile_contacts to authenticated;
grant insert, update, delete on public.listings to authenticated;
grant select, insert, update, delete on public.listing_locations to authenticated;
grant insert, update, delete on public.listing_photos to authenticated;
grant insert, delete on public.listing_amenities to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert on public.reports to authenticated;
