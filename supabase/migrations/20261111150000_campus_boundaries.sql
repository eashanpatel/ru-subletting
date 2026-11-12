-- Campus borders, drawn on the browse and listing maps in place of the old
-- 650 m circles. The outlines came in as GeoJSON LineStrings; each is closed
-- into a polygon by snapping its last point onto its first.

alter table public.campuses add column boundary extensions.geography(Polygon, 4326);

with outlines (slug, line) as (
  values
    ('busch', '{"type":"LineString","coordinates":[[-74.4751306,40.5190065],[-74.4669912,40.5291316],[-74.4652874,40.5283577],[-74.4592407,40.5279313],[-74.4521654,40.5255054],[-74.4507316,40.5234047],[-74.4516043,40.5196612],[-74.4556354,40.5165335],[-74.4577965,40.5149065],[-74.4588354,40.5133267],[-74.45904,40.5121034],[-74.4645557,40.5120332],[-74.4698406,40.5128403],[-74.4733876,40.5138443],[-74.4763416,40.5145285],[-74.4777725,40.5147741],[-74.4750954,40.5190024]]}'),
    ('livingston', '{"type":"LineString","coordinates":[[-74.4483174,40.5251012],[-74.44259,40.531782],[-74.432903,40.527156],[-74.4282092,40.523912],[-74.427021,40.5225853],[-74.42516,40.5196778],[-74.4276784,40.5185986],[-74.4287934,40.5177053],[-74.4293387,40.5178692],[-74.4311267,40.5169534],[-74.4336121,40.5195562],[-74.4342265,40.5189476],[-74.4407681,40.5226245],[-74.4483007,40.5250884]]}'),
    ('college-ave', '{"type":"LineString","coordinates":[[-74.4526532,40.5059106],[-74.4592786,40.5019335],[-74.4600032,40.5021664],[-74.4610763,40.500921],[-74.4493434,40.496401],[-74.4478937,40.4973904],[-74.4447875,40.4983245],[-74.4450756,40.4998013],[-74.4466437,40.5027227],[-74.4526791,40.5058903]]}'),
    ('cook-douglass', '{"type":"LineString","coordinates":[[-74.4369339,40.489034],[-74.4390816,40.4863642],[-74.4386782,40.4861237],[-74.440323,40.4846325],[-74.4386877,40.4836457],[-74.4403734,40.4820227],[-74.4427963,40.4796831],[-74.4402229,40.4782507],[-74.4415311,40.4772773],[-74.4388729,40.4750104],[-74.4407056,40.4738555],[-74.4349948,40.4693512],[-74.4276785,40.4747537],[-74.4211693,40.4801411],[-74.4186492,40.4831399],[-74.4202483,40.4845658],[-74.4269479,40.4857192],[-74.4325723,40.4867886],[-74.4353018,40.487816],[-74.436956,40.4890322]]}')
),
polygons as (
  select slug,
    extensions.st_makepolygon(
      extensions.st_setpoint(g, extensions.st_npoints(g) - 1, extensions.st_startpoint(g))
    ) as poly
  from (select slug, extensions.st_setsrid(extensions.st_geomfromgeojson(line), 4326) as g from outlines) o
)
update public.campuses c
set boundary = p.poly::extensions.geography
from polygons p
where c.slug = p.slug;

-- Guard: every outline must be a valid shape that contains its own campus point.
do $$
declare
  bad text;
begin
  select string_agg(slug, ', ') into bad
  from public.campuses
  where slug in ('busch', 'livingston', 'college-ave', 'cook-douglass')
    and (
      boundary is null
      or not extensions.st_isvalid(boundary::extensions.geometry)
      or not extensions.st_contains(boundary::extensions.geometry, location::extensions.geometry)
    );
  if bad is not null then
    raise exception 'Campus boundary check failed for: %', bad;
  end if;
end $$;

-- campus_points now also returns each border as GeoJSON (null where none is drawn).
drop function public.campus_points(text);

create function public.campus_points(p_school text)
returns table (slug text, name text, lat float8, lng float8, boundary jsonb)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.slug, c.name,
    extensions.st_y(c.location::extensions.geometry),
    extensions.st_x(c.location::extensions.geometry),
    case when c.boundary is not null
      then extensions.st_asgeojson(c.boundary::extensions.geometry, 7)::jsonb
    end
  from public.campuses c
  join public.schools s on s.id = c.school_id
  where s.slug = p_school
  order by c.name;
$$;

grant execute on function public.campus_points(text) to anon, authenticated;
