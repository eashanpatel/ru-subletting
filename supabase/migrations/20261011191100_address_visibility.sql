-- Lister-controlled exact address visibility:
--   private  only people the lister shares it with (default for new listings)
--   members  signed-in members
--   public   everyone
-- The street name and the ~100 m approximate point stay public in every mode.

create type public.address_visibility as enum ('private', 'members', 'public');

-- Existing listings keep today's behavior (signed-in members); new ones default to private.
alter table public.listings add column address_visibility public.address_visibility not null default 'members';
alter table public.listings alter column address_visibility set default 'private';

-- Exact locations are no longer readable straight from the table by any
-- signed-in user. Owners read their own; everyone else goes through
-- get_listing_location(), which applies the listing's setting.
drop policy "signed-in users read exact locations" on public.listing_locations;
create policy "owners read exact locations" on public.listing_locations for select to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

drop function public.get_listing_location(uuid);
create function public.get_listing_location(p_listing_id uuid)
returns table (address text, lat float8, lng float8)
language sql
stable
security definer
set search_path = ''
as $$
  select
    ll.address,
    extensions.st_y(ll.location::extensions.geometry),
    extensions.st_x(ll.location::extensions.geometry)
  from public.listing_locations ll
  join public.listings l on l.id = ll.listing_id
  where ll.listing_id = p_listing_id
    and (
      l.owner_id = (select auth.uid())
      or (
        l.status in ('active', 'taken')
        and (
          l.address_visibility = 'public'
          or (l.address_visibility = 'members' and (select auth.uid()) is not null)
        )
      )
    );
$$;

revoke execute on function public.get_listing_location(uuid) from public;
grant execute on function public.get_listing_location(uuid) to anon, authenticated;

-- get_listing: also return the address setting so the page can explain it.
drop function public.get_listing(uuid);
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
  campus_distances jsonb,
  address_visibility public.address_visibility
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
    ), '[]'::jsonb),
    l.address_visibility
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  where l.id = p_listing_id;
$$;

grant execute on function public.get_listing(uuid) to anon, authenticated;

-- get_listing_for_edit: include the setting.
create or replace function public.get_listing_for_edit(p_listing_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'id', l.id,
    'status', l.status,
    'room_type', l.room_type,
    'unit_label', l.unit_label,
    'description', l.description,
    'price', l.price_monthly,
    'starts_on', l.starts_on,
    'ends_on', l.ends_on,
    'beds', l.beds,
    'baths', l.baths,
    'neighborhood', l.neighborhood,
    'street_name', l.street_name,
    'address_visibility', l.address_visibility,
    'address', ll.address,
    'lat', extensions.st_y(ll.location::extensions.geometry),
    'lng', extensions.st_x(ll.location::extensions.geometry),
    'amenities', coalesce((select jsonb_agg(a.amenity_slug) from public.listing_amenities a where a.listing_id = l.id), '[]'::jsonb),
    'photos', coalesce((select jsonb_agg(p.storage_path order by p.position) from public.listing_photos p where p.listing_id = l.id), '[]'::jsonb),
    'contacts', coalesce((select jsonb_agg(jsonb_build_object('kind', m.kind, 'value', m.value) order by m.position)
                          from public.listing_contact_methods m where m.listing_id = l.id), '[]'::jsonb)
  )
  from public.listings l
  left join public.listing_locations ll on ll.listing_id = l.id
  where l.id = p_listing_id and l.owner_id = (select auth.uid());
$$;

-- save_listing: takes the setting. Recreated because the signature changes.
drop function public.save_listing(uuid, public.listing_status, text, public.room_type, text, text, integer, date, date, smallint, numeric, text, text, text, float8, float8, text[], text[], jsonb, text);

create function public.save_listing(
  p_id uuid,
  p_status public.listing_status,
  p_title text,
  p_room_type public.room_type,
  p_unit_label text,
  p_description text,
  p_price integer,
  p_starts_on date,
  p_ends_on date,
  p_beds smallint,
  p_baths numeric,
  p_neighborhood text,
  p_street_name text,
  p_address text,
  p_lat float8,
  p_lng float8,
  p_amenities text[],
  p_photos text[],
  p_contacts jsonb,
  p_address_visibility public.address_visibility default 'private',
  p_school text default 'rutgers-nb'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  school uuid := (select s.id from public.schools s where s.slug = p_school);
begin
  if uid is null then
    raise exception 'Sign in to post a listing.' using errcode = '28000';
  end if;
  if p_status not in ('draft', 'active', 'paused', 'taken') then
    raise exception 'Unknown status.' using errcode = '22023';
  end if;
  if p_status = 'active' and coalesce(cardinality(p_photos), 0) = 0 then
    raise exception 'Add at least one photo before publishing.' using errcode = '22023';
  end if;
  if p_status = 'active' and (p_lat is null or p_lng is null) then
    raise exception 'Pick the address from the suggestions before publishing.' using errcode = '22023';
  end if;
  if p_status = 'active' and coalesce(trim(p_street_name), '') = '' then
    raise exception 'Add the street name so people can see roughly where it is.' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p_contacts, '[]'::jsonb)) c
             where not (c->>'kind' = any (enum_range(null::public.contact_kind)::text[]))) then
    raise exception 'Unknown contact method.' using errcode = '22023';
  end if;

  if exists (select 1 from public.listings where id = p_id) then
    update public.listings set
      status = p_status, title = p_title, room_type = p_room_type, unit_label = nullif(p_unit_label, ''),
      description = nullif(p_description, ''), price_monthly = p_price, starts_on = p_starts_on, ends_on = p_ends_on,
      beds = p_beds, baths = p_baths, neighborhood = nullif(p_neighborhood, ''), street_name = nullif(p_street_name, ''),
      address_visibility = coalesce(p_address_visibility, 'private')
    where id = p_id and owner_id = uid;
    if not found then
      raise exception 'You can only edit your own listings.' using errcode = '42501';
    end if;
  else
    insert into public.listings (
      id, owner_id, school_id, status, title, room_type, unit_label, description, price_monthly,
      starts_on, ends_on, beds, baths, neighborhood, street_name, address_visibility
    ) values (
      p_id, uid, school, p_status, p_title, p_room_type, nullif(p_unit_label, ''), nullif(p_description, ''), p_price,
      p_starts_on, p_ends_on, p_beds, p_baths, nullif(p_neighborhood, ''), nullif(p_street_name, ''),
      coalesce(p_address_visibility, 'private')
    );
  end if;

  if p_lat is not null and p_lng is not null and coalesce(p_address, '') <> '' then
    insert into public.listing_locations (listing_id, address, location)
    values (p_id, p_address, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography)
    on conflict (listing_id) do update set address = excluded.address, location = excluded.location;
  end if;

  delete from public.listing_amenities where listing_id = p_id;
  insert into public.listing_amenities (listing_id, amenity_slug)
  select p_id, a from unnest(coalesce(p_amenities, '{}')) as a
  on conflict do nothing;

  delete from public.listing_photos where listing_id = p_id;
  insert into public.listing_photos (listing_id, storage_path, position)
  select p_id, path, (ord - 1)::smallint
  from unnest(coalesce(p_photos, '{}')) with ordinality as t (path, ord);

  delete from public.listing_contact_methods where listing_id = p_id;
  insert into public.listing_contact_methods (listing_id, kind, value, position)
  select p_id, (c->>'kind')::public.contact_kind, trim(c->>'value'), (ord - 1)::smallint
  from jsonb_array_elements(coalesce(p_contacts, '[]'::jsonb)) with ordinality as t (c, ord)
  where trim(coalesce(c->>'value', '')) <> '';

  return p_id;
end;
$$;

revoke execute on function public.save_listing(uuid, public.listing_status, text, public.room_type, text, text, integer, date, date, smallint, numeric, text, text, text, float8, float8, text[], text[], jsonb, public.address_visibility, text) from public, anon;
grant execute on function public.save_listing(uuid, public.listing_status, text, public.room_type, text, text, integer, date, date, smallint, numeric, text, text, text, float8, float8, text[], text[], jsonb, public.address_visibility, text) to authenticated;
