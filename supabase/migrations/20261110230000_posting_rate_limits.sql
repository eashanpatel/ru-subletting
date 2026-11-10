-- Posting rate limits for launch.
--
-- Every new listing a signed-in person creates (a draft counts, since that is
-- when the row is made) is written to a private log. Deleting a listing does
-- not remove its log row, so delete-and-repost can't get around the limit.
--
--   * 5 new listings per rolling 24 hours
--   * 15 new listings per rolling 30 days
--
-- Editing, pausing, relisting, and publishing an existing draft are free.
-- Inserts with no signed-in user (the SQL editor, seed and demo scripts) are
-- not limited.

create table public.listing_post_log (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  listing_id uuid not null,
  created_at timestamptz not null default now()
);

create index listing_post_log_owner_created on public.listing_post_log (owner_id, created_at desc);

-- Private: no policies, so only security definer functions can read or write it.
alter table public.listing_post_log enable row level security;
revoke all on public.listing_post_log from anon, authenticated;

-- Carry over recent history so the limits apply from the moment this ships.
insert into public.listing_post_log (owner_id, listing_id, created_at)
select owner_id, id, created_at
from public.listings
where created_at > now() - interval '30 days';

-- The limits in one place, read by the trigger and by the allowance check.
create function public.posting_allowance_for(p_owner uuid)
returns table (day_left integer, month_left integer, next_post_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with recent as (
    select created_at from public.listing_post_log
    where owner_id = p_owner and created_at > now() - interval '30 days'
  ),
  day_rows as (select created_at from recent where created_at > now() - interval '24 hours')
  select
    greatest(0, 5 - (select count(*) from day_rows))::integer,
    greatest(0, 15 - (select count(*) from recent))::integer,
    case
      when (select count(*) from recent) >= 15
        then (select created_at from recent order by created_at desc offset 14 limit 1) + interval '30 days'
      when (select count(*) from day_rows) >= 5
        then (select created_at from day_rows order by created_at desc offset 4 limit 1) + interval '24 hours'
    end;
$$;

revoke execute on function public.posting_allowance_for(uuid) from public, anon, authenticated;

create or replace function public.limit_listing_creation() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  a record;
  wait_hours integer;
begin
  -- Seed and demo scripts run without a signed-in user.
  if auth.uid() is null then
    return new;
  end if;

  -- One insert at a time per person, so two quick saves can't both slip under the limit.
  perform pg_advisory_xact_lock(hashtextextended('listing_post:' || new.owner_id::text, 0));

  select * into a from public.posting_allowance_for(new.owner_id);

  if a.day_left = 0 or a.month_left = 0 then
    wait_hours := greatest(1, ceil(extract(epoch from (a.next_post_at - now())) / 3600))::integer;
    raise exception '%',
      case
        when a.month_left = 0 then
          format('You''ve posted 15 listings in the last 30 days, the most allowed. You can post again in about %s.',
                 case when wait_hours >= 48 then (wait_hours / 24) || ' days' else wait_hours || ' hours' end)
        else
          format('You''ve posted 5 listings in the last 24 hours, the most allowed. You can post again in about %s.',
                 case when wait_hours = 1 then '1 hour' else wait_hours || ' hours' end)
      end
      using errcode = 'P0001';
  end if;

  insert into public.listing_post_log (owner_id, listing_id) values (new.owner_id, new.id);
  return new;
end;
$$;

revoke execute on function public.limit_listing_creation() from public, anon, authenticated;

-- For the Post a sublet page: how many new listings the signed-in person has left.
create function public.get_posting_allowance()
returns table (day_left integer, month_left integer, next_post_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.posting_allowance_for(auth.uid()) where auth.uid() is not null;
$$;

revoke execute on function public.get_posting_allowance() from public, anon;
grant execute on function public.get_posting_allowance() to authenticated;
