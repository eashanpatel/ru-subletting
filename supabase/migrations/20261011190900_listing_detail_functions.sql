-- Listing page data.

-- Everything public about one listing: details, photos, amenities, owner's
-- public profile, and distance to every campus. Runs as the caller, so RLS
-- decides visibility (active/taken for everyone; any status for the owner).
create function public.get_listing(p_listing_id uuid)
returns table (
  id uuid,
  owner_id uuid,
  title text,
  description text,
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
  owner_name text,
  owner_since timestamptz,
  photo_paths text[],
  amenities text[],
  campus_distances jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.id, l.owner_id, l.title, l.description, l.room_type, l.unit_label, l.street_name, l.neighborhood,
    l.price_monthly, l.starts_on, l.ends_on, l.beds, l.baths, l.status, l.created_at,
    extensions.st_y(l.location_approx::extensions.geometry),
    extensions.st_x(l.location_approx::extensions.geometry),
    p.full_name,
    p.created_at,
    coalesce((select array_agg(ph.storage_path order by ph.position) from public.listing_photos ph where ph.listing_id = l.id), '{}'),
    coalesce((select array_agg(a.amenity_slug order by a.amenity_slug) from public.listing_amenities a where a.listing_id = l.id), '{}'),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', c.slug,
        'name', c.name,
        'distance_m', extensions.st_distance(l.location_approx, c.location)
      ) order by extensions.st_distance(l.location_approx, c.location))
      from public.campuses c
      where c.school_id = l.school_id and l.location_approx is not null
    ), '[]'::jsonb)
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  where l.id = p_listing_id;
$$;

grant execute on function public.get_listing(uuid) to anon, authenticated;

-- Exact address and point. Signed-in users only (RLS on listing_locations).
create function public.get_listing_location(p_listing_id uuid)
returns table (address text, lat float8, lng float8)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    ll.address,
    extensions.st_y(ll.location::extensions.geometry),
    extensions.st_x(ll.location::extensions.geometry)
  from public.listing_locations ll
  where ll.listing_id = p_listing_id;
$$;

revoke execute on function public.get_listing_location(uuid) from public, anon;
grant execute on function public.get_listing_location(uuid) to authenticated;
