import { cacheLife } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { type ReferenceData, SCHOOL_SLUG } from "@/lib/browse";

/** Campuses, semesters, and amenities. Changes rarely, so it is cached. */
export async function getReferenceData(): Promise<ReferenceData> {
  "use cache";
  cacheLife("hours");

  const supabase = createPublicClient();
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id")
    .eq("slug", SCHOOL_SLUG)
    .single();
  if (schoolError) throw schoolError;

  const [campuses, semesters, amenities] = await Promise.all([
    supabase.rpc("campus_points", { p_school: SCHOOL_SLUG }),
    supabase.from("semesters").select("slug, label, starts_on, ends_on").eq("school_id", school.id).order("starts_on"),
    supabase.from("amenities").select("slug, label").order("sort_order"),
  ]);
  if (campuses.error) throw campuses.error;
  if (semesters.error) throw semesters.error;
  if (amenities.error) throw amenities.error;

  return {
    campuses: campuses.data.map((c) => ({ slug: c.slug, name: c.name, lat: c.lat, lng: c.lng })),
    semesters: semesters.data.map((s) => ({ slug: s.slug, label: s.label, startsOn: s.starts_on, endsOn: s.ends_on })),
    amenities: amenities.data,
  };
}
