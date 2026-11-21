import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/components/marketing/seo";

/** Public marketing pages are indexable; the patient portal, admin and API are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/appointments",
          "/visits",
          "/profile",
          "/voice",
          "/pro",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
