-- Testing: allow up to 20 new listings per user per 24 hours (was 5).
-- Lower this again before launch.
create or replace function public.limit_listing_creation() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.listings
    where owner_id = new.owner_id and created_at > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'You can post up to 20 listings a day. Try again tomorrow.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_listing_creation() from public, anon, authenticated;
