-- Fixes from `supabase db advisors`, plus search scopes for Saved and My listings.

-- Trigger functions are not meant to be called through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.limit_listing_creation() from public, anon, authenticated;
revoke execute on function public.sync_listing_location_approx() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Leftover from the dropped draft schema.
drop function if exists public.get_my_profile() cascade;

-- One permissive policy per role and action (the "for all" write policies
-- overlapped the read policies).
drop policy "owners write exact locations" on public.listing_locations;
create policy "owners insert exact locations" on public.listing_locations for insert to authenticated
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "owners update exact locations" on public.listing_locations for update to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "owners delete exact locations" on public.listing_locations for delete to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

drop policy "owners write photos" on public.listing_photos;
create policy "owners insert photos" on public.listing_photos for insert to authenticated
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "owners update photos" on public.listing_photos for update to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "owners delete photos" on public.listing_photos for delete to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

drop policy "owners write listing amenities" on public.listing_amenities;
create policy "owners insert listing amenities" on public.listing_amenities for insert to authenticated
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "owners delete listing amenities" on public.listing_amenities for delete to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

-- search_listings gains two scopes:
--   p_favorites_only: only listings the caller saved
--   p_mine: only the caller's listings, in every status (drafts, paused, ...)
drop function public.search_listings(text, text, text, integer, public.room_type, text[], float8, float8, float8, float8, text, integer, integer);

create function public.search_listings(
  p_school text,
  p_campus text default null,
  p_semester text default null,
  p_max_price integer default null,
  p_room_type public.room_type default null,
  p_amenities text[] default null,
  p_west float8 default null,
  p_south float8 default null,
  p_east float8 default null,
  p_north float8 default null,
  p_sort text default 'closest',
  p_limit integer default 50,
  p_offset integer default 0,
  p_favorites_only boolean default false,
  p_mine boolean default false
)
returns table (
  id uuid,
  title text,
  room_type public.room_type,
  unit_label text,
  street_name text,
  neighborhood text,
  price_monthly integer,
  starts_on date,
  ends_on date,
  beds smallint,
  baths numeric,
  status public.listing_status,
  created_at timestamptz,
  lat float8,
  lng float8,
  campus_slug text,
  campus_name text,
  distance_m float8,
  cover_path text,
  photo_count integer,
  amenities text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  with school as (
    select s.id from public.schools s where s.slug = p_school
  ),
  sem as (
    select se.starts_on, se.ends_on
    from public.semesters se
    where se.school_id = (select id from school) and se.slug = p_semester
  )
  select
    l.id, l.title, l.room_type, l.unit_label, l.street_name, l.neighborhood,
    l.price_monthly, l.starts_on, l.ends_on, l.beds, l.baths, l.status, l.created_at,
    extensions.st_y(l.location_approx::extensions.geometry),
    extensions.st_x(l.location_approx::extensions.geometry),
    near.slug, near.name, near.dist,
    (select p.storage_path from public.listing_photos p where p.listing_id = l.id order by p.position limit 1),
    (select count(*)::int from public.listing_photos p where p.listing_id = l.id),
    coalesce((select array_agg(a.amenity_slug order by a.amenity_slug) from public.listing_amenities a where a.listing_id = l.id), '{}')
  from public.listings l
  left join lateral (
    select c.slug, c.name, extensions.st_distance(l.location_approx, c.location) as dist
    from public.campuses c
    where c.school_id = l.school_id and (p_campus is null or c.slug = p_campus)
    order by dist
    limit 1
  ) near on true
  where l.school_id = (select id from school)
    and (
      (p_mine and l.owner_id = (select auth.uid()))
      or (not p_mine and l.status in ('active', 'taken'))
    )
    and (not p_favorites_only or exists (
      select 1 from public.favorites f where f.listing_id = l.id and f.user_id = (select auth.uid())
    ))
    and (p_semester is null or exists (
      select 1 from sem where l.starts_on < sem.ends_on and l.ends_on > sem.starts_on
    ))
    and (p_max_price is null or l.price_monthly <= p_max_price)
    and (p_room_type is null or l.room_type = p_room_type)
    and (p_amenities is null or cardinality(p_amenities) = 0 or (
      select coalesce(array_agg(a.amenity_slug), '{}') from public.listing_amenities a where a.listing_id = l.id
    ) @> p_amenities)
    and (p_west is null or extensions.st_intersects(
      l.location_approx,
      extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)::extensions.geography
    ))
  order by
    (l.status = 'taken'),
    case when p_sort = 'price_asc' then l.price_monthly end asc,
    case when p_sort = 'price_desc' then l.price_monthly end desc,
    case when p_sort = 'newest' then l.created_at end desc,
    near.dist asc nulls last,
    l.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.search_listings(text, text, text, integer, public.room_type, text[], float8, float8, float8, float8, text, integer, integer, boolean, boolean) to anon, authenticated;
