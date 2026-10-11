-- Posting and editing listings.
--   * listing_contact_methods: per-listing ways to reach the lister
--     (replaces the show_email/show_phone switches and profile contact use)
--   * save_listing(): create or update a listing and all its parts in one
--     transaction, as the signed-in caller (RLS applies)
--   * get_listing_contacts(): contact methods for signed-in viewers

create type public.contact_kind as enum ('email', 'phone', 'whatsapp', 'instagram', 'snapchat', 'other');

create table public.listing_contact_methods (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  kind public.contact_kind not null,
  value text not null check (char_length(value) between 1 and 200),
  position smallint not null default 0,
  unique (listing_id, position)
);

create index listing_contact_methods_listing_idx on public.listing_contact_methods (listing_id);

alter table public.listing_contact_methods enable row level security;

-- Owners manage their own; everyone else goes through get_listing_contacts().
create policy "owners read contact methods" on public.listing_contact_methods for select to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "owners insert contact methods" on public.listing_contact_methods for insert to authenticated
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "owners update contact methods" on public.listing_contact_methods for update to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "owners delete contact methods" on public.listing_contact_methods for delete to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

grant select, insert, update, delete on public.listing_contact_methods to authenticated;

-- Contact methods for a listing. Signed-in viewers only, active listings only.
create function public.get_listing_contacts(p_listing_id uuid)
returns table (kind public.contact_kind, value text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.kind, m.value
  from public.listing_contact_methods m
  join public.listings l on l.id = m.listing_id
  where m.listing_id = p_listing_id
    and l.status = 'active'
    and (select auth.uid()) is not null
  order by m.position;
$$;

revoke execute on function public.get_listing_contacts(uuid) from public, anon;
grant execute on function public.get_listing_contacts(uuid) to authenticated;

-- The old email/phone path is replaced by contact methods.
drop function public.get_listing_contact(uuid);
alter table public.listings drop column show_email, drop column show_phone;

-- Create or update a listing with its location, amenities, photos, and
-- contact methods. The client generates the id so photos can be uploaded to
-- "<user>/<listing>/..." before saving.
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
  if exists (select 1 from jsonb_array_elements(coalesce(p_contacts, '[]'::jsonb)) c
             where not (c->>'kind' = any (enum_range(null::public.contact_kind)::text[]))) then
    raise exception 'Unknown contact method.' using errcode = '22023';
  end if;

  if exists (select 1 from public.listings where id = p_id) then
    update public.listings set
      status = p_status, title = p_title, room_type = p_room_type, unit_label = nullif(p_unit_label, ''),
      description = nullif(p_description, ''), price_monthly = p_price, starts_on = p_starts_on, ends_on = p_ends_on,
      beds = p_beds, baths = p_baths, neighborhood = nullif(p_neighborhood, ''), street_name = nullif(p_street_name, '')
    where id = p_id and owner_id = uid;
    if not found then
      raise exception 'You can only edit your own listings.' using errcode = '42501';
    end if;
  else
    insert into public.listings (
      id, owner_id, school_id, status, title, room_type, unit_label, description, price_monthly,
      starts_on, ends_on, beds, baths, neighborhood, street_name
    ) values (
      p_id, uid, school, p_status, p_title, p_room_type, nullif(p_unit_label, ''), nullif(p_description, ''), p_price,
      p_starts_on, p_ends_on, p_beds, p_baths, nullif(p_neighborhood, ''), nullif(p_street_name, '')
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

revoke execute on function public.save_listing(uuid, public.listing_status, text, public.room_type, text, text, integer, date, date, smallint, numeric, text, text, text, float8, float8, text[], text[], jsonb, text) from public, anon;
grant execute on function public.save_listing(uuid, public.listing_status, text, public.room_type, text, text, integer, date, date, smallint, numeric, text, text, text, float8, float8, text[], text[], jsonb, text) to authenticated;

-- Owner-only editing data: the full listing in any status plus its exact
-- location and contact methods, in one call.
create function public.get_listing_for_edit(p_listing_id uuid)
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

revoke execute on function public.get_listing_for_edit(uuid) from public, anon;
grant execute on function public.get_listing_for_edit(uuid) to authenticated;
