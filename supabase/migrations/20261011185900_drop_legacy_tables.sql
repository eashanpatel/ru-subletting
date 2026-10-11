-- Remove an earlier, empty draft schema (created outside these migrations) so
-- the initial schema applies cleanly. All five tables had 0 rows when this was
-- written; dropping them was approved by the project owner.

-- Triggers on auth.users that call public-schema functions would break sign-ups
-- once their target tables are gone.
do $$
declare
  t record;
begin
  for t in
    select tg.tgname
    from pg_trigger tg
    join pg_proc p on p.oid = tg.tgfoid
    join pg_namespace n on n.oid = p.pronamespace
    where tg.tgrelid = 'auth.users'::regclass
      and not tg.tgisinternal
      and n.nspname = 'public'
  loop
    execute format('drop trigger if exists %I on auth.users', t.tgname);
  end loop;
end;
$$;

drop table if exists public.favorites cascade;
drop table if exists public.listing_images cascade;
drop table if exists public.listing_private_details cascade;
drop table if exists public.listings cascade;
drop table if exists public.profiles cascade;

-- Names the new schema creates; remove any earlier versions.
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.sync_listing_location_approx() cascade;
drop function if exists public.limit_listing_creation() cascade;
drop function if exists public.get_listing_contact(uuid) cascade;
drop type if exists public.room_type cascade;
drop type if exists public.listing_status cascade;

-- Storage policies the photo-bucket migration recreates.
drop policy if exists "anyone can view listing photos" on storage.objects;
drop policy if exists "users upload to own folder" on storage.objects;
drop policy if exists "users update own photos" on storage.objects;
drop policy if exists "users delete own photos" on storage.objects;
