import { siteConfig } from "@/config/site";
import type { PublicDoctorDTO } from "@/lib/actions/doctors";
import type { ServiceDTO } from "@/lib/actions/services";

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

const clinicId = () => absoluteUrl("/#clinic");

/** schema.org Dentist (a MedicalClinic-like LocalBusiness) built only from siteConfig and the database. */
export function clinicJsonLd({
  services,
  doctors,
}: {
  services: ServiceDTO[] | null;
  doctors: PublicDoctorDTO[] | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": ["Dentist", "MedicalClinic"],
    "@id": clinicId(),
    name: siteConfig.name,
    slogan: siteConfig.tagline,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
    image: absoluteUrl("/opengraph-image"),
    telephone: siteConfig.phone,
    email: siteConfig.supportEmail,
    address: { "@type": "PostalAddress", streetAddress: siteConfig.address },
    medicalSpecialty: "Dentistry",
    currenciesAccepted: siteConfig.clinic.currency,
    ...(services?.length
      ? {
          availableService: services.map((s) => ({
            "@type": "MedicalProcedure",
            name: s.name,
            description: s.description,
            url: absoluteUrl(`/services#${s.slug}`),
          })),
        }
      : {}),
    ...(doctors?.length
      ? {
          employee: doctors.map((d) => ({
            "@type": "Person",
            name: d.name,
            jobTitle: d.speciality,
            ...(d.slug ? { url: absoluteUrl(`/dentists/${d.slug}`) } : {}),
          })),
        }
      : {}),
  };
}

export function dentistJsonLd(d: PublicDoctorDTO) {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: d.name,
    description: d.bio ?? undefined,
    medicalSpecialty: "Dentistry",
    knowsLanguage: d.languages,
    ...(d.slug ? { url: absoluteUrl(`/dentists/${d.slug}`) } : {}),
    ...(d.education ? { alumniOf: d.education } : {}),
    worksFor: { "@id": clinicId(), "@type": "Dentist", name: siteConfig.name },
    ...(d.rating.count > 0 && d.rating.average !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: d.rating.average,
            reviewCount: d.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
