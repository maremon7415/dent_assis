import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/components/marketing/seo";
import { getActiveDoctors } from "@/lib/actions/doctors";

export const revalidate = 3600;

/**
 * Public pages plus every active dentist profile. Services have no page of their own (they are
 * anchors on /services) and URL fragments are not separate documents to a crawler, so /services
 * stands for all of them. Degrades to the static pages if the DB is down.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const doctors = await getActiveDoctors();
  const page = (
    path: string,
    changeFrequency: "daily" | "weekly" | "monthly",
    priority: number,
  ) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  });

  const pages: MetadataRoute.Sitemap = [
    page("/", "daily", 1),
    page("/services", "weekly", 0.9),
    page("/dentists", "weekly", 0.9),
    page("/pricing", "monthly", 0.7),
    page("/about", "monthly", 0.6),
    page("/faq", "monthly", 0.6),
  ];
  const dentistPages: MetadataRoute.Sitemap = doctors.ok
    ? doctors.data
        .filter((d) => d.slug)
        .map((d) => page(`/dentists/${d.slug}`, "weekly", 0.8))
    : [];
  return [...pages, ...dentistPages];
}
