import type { Metadata } from "next";
import {
  loadDoctors,
  loadNextOpening,
  loadServices,
} from "@/components/marketing/data";
import { AssistantBand } from "@/components/marketing/home/AssistantBand";
import {
  FaqTeaser,
  FinalCta,
  PricingTeaser,
} from "@/components/marketing/home/Closing";
import { DentistsTeaser } from "@/components/marketing/home/DentistsTeaser";
import { Hero } from "@/components/marketing/home/Hero";
import { HowItWorks } from "@/components/marketing/home/HowItWorks";
import { ServicesTeaser } from "@/components/marketing/home/ServicesTeaser";
import { JsonLd, MarketingPage } from "@/components/marketing/primitives";
import { clinicJsonLd } from "@/components/marketing/seo";
import { siteConfig } from "@/config/site";

/** The hero shows real open times, so keep the page fresh without rendering it per request. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name}: ${siteConfig.tagline}` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.name}: ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: "/",
  },
};

export default async function Home() {
  const [services, doctors, opening] = await Promise.all([
    loadServices(),
    loadDoctors(),
    loadNextOpening(),
  ]);

  return (
    <MarketingPage>
      <JsonLd data={clinicJsonLd({ services, doctors })} />
      <Hero
        opening={opening}
        dentistCount={doctors?.length ?? 0}
        serviceCount={services?.length ?? 0}
      />
      <HowItWorks />
      <ServicesTeaser services={services} />
      <DentistsTeaser doctors={doctors} />
      <AssistantBand />
      <PricingTeaser />
      <FaqTeaser />
      <FinalCta />
    </MarketingPage>
  );
}
