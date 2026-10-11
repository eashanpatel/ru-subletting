-- Semester spans from the official Rutgers–New Brunswick academic calendar
-- (https://scheduling.rutgers.edu/academic-calendar/), first day of classes
-- through the last day of final exams. Replaces the estimates in
-- 20261011190100_rutgers_reference_data.sql.
--   Spring 2027: classes begin Tue Jan 19, finals end Wed May 12
--   Summer 2027: summer session Tue Jun 1 to Wed Aug 18
--   Fall 2027:   classes begin Wed Sep 1, finals end Thu Dec 23

update public.semesters se
set starts_on = v.starts_on::date, ends_on = v.ends_on::date
from public.schools s,
  (values
    ('spring-2027', '2027-01-19', '2027-05-12'),
    ('summer-2027', '2027-06-01', '2027-08-18'),
    ('fall-2027', '2027-09-01', '2027-12-23')
  ) as v (slug, starts_on, ends_on)
where se.school_id = s.id
  and s.slug = 'rutgers-nb'
  and se.slug = v.slug;
