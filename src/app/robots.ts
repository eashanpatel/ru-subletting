import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/saved", "/my-listings", "/listings/new", "/listings/*/edit", "/auth/", "/update-password"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
