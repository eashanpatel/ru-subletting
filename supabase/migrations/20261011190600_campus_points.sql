-- Campus locations as plain lat/lng (geography columns serialize as WKB).
create function public.campus_points(p_school text)
returns table (slug text, name text, lat float8, lng float8)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.slug, c.name,
    extensions.st_y(c.location::extensions.geometry),
    extensions.st_x(c.location::extensions.geometry)
  from public.campuses c
  join public.schools s on s.id = c.school_id
  where s.slug = p_school
  order by c.name;
$$;

grant execute on function public.campus_points(text) to anon, authenticated;
