-- RU Subletting: initial schema.
-- Multi-school by design (schools table); Rutgers is the only school at launch.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Reference data: schools, campuses, semesters, amenities
-- ---------------------------------------------------------------------------

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  email_domain text,
  center extensions.geography(Point, 4326) not null,
  created_at timestamptz not null default now()
);

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  slug text not null,
  name text not null,
  location extensions.geography(Point, 4326) not null,
  unique (school_id, slug)
);

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  slug text not null,
  label text not null,
  starts_on date not null,
  ends_on date not null,
  unique (school_id, slug),
  check (ends_on > starts_on)
);

create table public.amenities (
  slug text primary key,
  label text not null,
  sort_order smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

-- Public profile: safe to show to anyone.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 80),
  avatar_url text,
  school_id uuid references public.schools (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private contact details: readable only by the owner. Shared with signed-in
-- viewers only through get_listing_contact(), per listing toggles.
create table public.profile_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  contact_email text check (char_length(contact_email) <= 254),
  contact_phone text check (char_length(contact_phone) <= 32),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------

create type public.room_type as enum ('private_room', 'shared_room', 'entire_place', 'studio');
create type public.listing_status as enum ('draft', 'active', 'paused', 'taken');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id),
  title text not null check (char_length(title) between 3 and 120),
  description text check (char_length(description) <= 5000),
  price_monthly integer not null check (price_monthly > 0 and price_monthly < 20000),
  starts_on date not null,
  ends_on date not null,
  room_type public.room_type not null,
  -- Reads after the room type on cards, e.g. "in 3BR" or "1BR".
  unit_label text check (char_length(unit_label) <= 40),
  beds smallint check (beds between 0 and 20),
  baths numeric(3, 1) check (baths between 0 and 10),
  neighborhood text check (char_length(neighborhood) <= 60),
  street_name text check (char_length(street_name) <= 80),
  -- Rounded to roughly 100 m; set from listing_locations. Public.
  location_approx extensions.geography(Point, 4326),
  status public.listing_status not null default 'active',
  show_email boolean not null default true,
  show_phone boolean not null default false,
  -- Room for featured listings later; unused for now.
  featured_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on > starts_on)
);

create index listings_location_approx_idx on public.listings using gist (location_approx);
create index listings_school_status_idx on public.listings (school_id, status);
create index listings_dates_idx on public.listings (starts_on, ends_on);
create index listings_price_idx on public.listings (price_monthly);
create index listings_owner_idx on public.listings (owner_id);

-- Exact address and point: signed-in users only.
create table public.listing_locations (
  listing_id uuid primary key references public.listings (id) on delete cascade,
  address text not null check (char_length(address) <= 200),
  location extensions.geography(Point, 4326) not null
);

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);

create table public.listing_amenities (
  listing_id uuid not null references public.listings (id) on delete cascade,
  amenity_slug text not null references public.amenities (slug) on delete cascade,
  primary key (listing_id, amenity_slug)
);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger profile_contacts_updated_at before update on public.profile_contacts
  for each row execute function public.set_updated_at();
create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

-- New auth user -> profile + private contact row.
create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.profile_contacts (user_id, contact_email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill accounts created before this migration ran.
insert into public.profiles (id, full_name, avatar_url)
select u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

insert into public.profile_contacts (user_id, contact_email)
select u.id, u.email from auth.users u
on conflict (user_id) do nothing;

-- Exact point -> rounded public point (about 100 m).
create function public.sync_listing_location_approx() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listings
  set location_approx = extensions.st_setsrid(
    extensions.st_makepoint(
      round(extensions.st_x(new.location::extensions.geometry)::numeric, 3)::float8,
      round(extensions.st_y(new.location::extensions.geometry)::numeric, 3)::float8
    ),
    4326
  )::extensions.geography
  where id = new.listing_id;
  return new;
end;
$$;

create trigger listing_locations_sync after insert or update of location on public.listing_locations
  for each row execute function public.sync_listing_location_approx();

-- Basic spam brake: at most 5 new listings per user per 24 hours.
create function public.limit_listing_creation() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.listings
    where owner_id = new.owner_id and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'You can post up to 5 listings a day. Try again tomorrow.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger listings_rate_limit before insert on public.listings
  for each row execute function public.limit_listing_creation();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.schools enable row level security;
alter table public.campuses enable row level security;
alter table public.semesters enable row level security;
alter table public.amenities enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.listings enable row level security;
alter table public.listing_locations enable row level security;
alter table public.listing_photos enable row level security;
alter table public.listing_amenities enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;

-- Reference data: readable by everyone.
create policy "schools are public" on public.schools for select to anon, authenticated using (true);
create policy "campuses are public" on public.campuses for select to anon, authenticated using (true);
create policy "semesters are public" on public.semesters for select to anon, authenticated using (true);
create policy "amenities are public" on public.amenities for select to anon, authenticated using (true);

-- Profiles: public read, owner update. Inserted by handle_new_user().
create policy "profiles are public" on public.profiles for select to anon, authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Contacts: owner only.
create policy "users read own contacts" on public.profile_contacts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users update own contacts" on public.profile_contacts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Listings: active and taken are public; owners see their own drafts and paused ones.
create policy "visible listings are public" on public.listings for select to anon, authenticated
  using (status in ('active', 'taken') or (select auth.uid()) = owner_id);
create policy "users create own listings" on public.listings for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "users update own listings" on public.listings for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users delete own listings" on public.listings for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Exact locations: signed-in users can read rows of listings they can see; owners write.
create policy "signed-in users read exact locations" on public.listing_locations for select to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "owners write exact locations" on public.listing_locations for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

-- Photos and amenities follow their listing's visibility; owners write.
create policy "photos follow listing visibility" on public.listing_photos for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "owners write photos" on public.listing_photos for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

create policy "amenities follow listing visibility" on public.listing_amenities for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "owners write listing amenities" on public.listing_amenities for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

-- Favorites: owner only.
create policy "users manage own favorites" on public.favorites for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Reports: users file and see their own; reviewing happens with the service role.
create policy "users file reports" on public.reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id);
create policy "users read own reports" on public.reports for select to authenticated
  using ((select auth.uid()) = reporter_id);

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

-- Contact details for a listing, honoring the owner's toggles. Signed-in only.
create function public.get_listing_contact(p_listing_id uuid)
returns table (contact_email text, contact_phone text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when l.show_email then c.contact_email end,
    case when l.show_phone then c.contact_phone end
  from public.listings l
  join public.profile_contacts c on c.user_id = l.owner_id
  where l.id = p_listing_id
    and l.status = 'active'
    and (select auth.uid()) is not null;
$$;

revoke execute on function public.get_listing_contact(uuid) from public, anon;
grant execute on function public.get_listing_contact(uuid) to authenticated;

-- Browse search. Runs as the caller, so RLS applies. Distance is to the chosen
-- campus, or to the nearest campus when none is chosen.
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
  p_offset integer default 0
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
    and l.status in ('active', 'taken')
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

grant execute on function public.search_listings(text, text, text, integer, public.room_type, text[], float8, float8, float8, float8, text, integer, integer) to anon, authenticated;
