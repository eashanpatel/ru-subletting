import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/site-url";

/** Browse plus every live listing. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("hours");

  const { data } = await createPublicClient()
    .from("listings")
    .select("id, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(5000);

  return [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
    ...(data ?? []).map((l) => ({
      url: `${SITE_URL}/listings/${l.id}`,
      lastModified: l.updated_at,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
