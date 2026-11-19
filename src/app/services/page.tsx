import type { Metadata } from "next";
import Link from "next/link";
import { loadServices } from "@/components/marketing/data";
import {
  formatPrice,
  groupByCategory,
  slugify,
} from "@/components/marketing/format";
import {
  Container,
  DataUnavailable,
  JsonLd,
  MarketingPage,
  PageIntro,
} from "@/components/marketing/primitives";
import { ServiceMenu } from "@/components/marketing/ServiceMenu";
import { breadcrumbJsonLd } from "@/components/marketing/seo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

const description = `Every treatment at ${siteConfig.name} with its time in the chair and standard fee: check-ups, hygiene, fillings, root canals, whitening, aligners and same-day emergency visits.`;

export const metadata: Metadata = {
  title: "Treatments and prices",
  description,
  alternates: { canonical: "/services" },
  openGraph: {
    title: `Treatments and prices · ${siteConfig.name}`,
    description,
    url: "/services",
  },
};

export default async function ServicesPage() {
  const services = await loadServices();
  const groups = services ? groupByCategory(services) : [];
  const from = services
    ?.filter((s) => s.priceCents > 0)
    .sort((a, b) => a.priceCents - b.priceCents)[0];

  return (
    <MarketingPage>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Treatments", path: "/services" },
        ])}
      />
      <Container className="pt-12 pb-10 sm:pt-16 lg:pt-20">
        <PageIntro
          title="Treatments and prices"
          lede={
            services && services.length > 0
              ? `${services.length} treatments, each with its time in the chair and our standard fee${from ? `, from ${formatPrice(from.priceCents)}` : ""}. Your dentist confirms the cost of anything extra before starting.`
              : "Each treatment shows its time in the chair and our standard fee. Your dentist confirms the cost of anything extra before starting."
          }
        />
      </Container>

      <Container className="pb-24">
        {services === null ? (
          <DataUnavailable what="Treatments" />
        ) : services.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center">
            <p className="font-display text-xl text-foreground">
              Our treatment list is being updated
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Book a visit and tell us what you need; the front desk will match
              you with the right dentist.
            </p>
            <Button asChild className="mt-5">
              <Link href="/appointments">Book a visit</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <nav aria-label="Areas of care" className="min-w-0 lg:col-span-3">
              <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
                {groups.map((g) => (
                  <li key={g.category} className="shrink-0">
                    <a
                      href={`#${slugify(g.category)}`}
                      className="focus-ring flex items-center justify-between gap-4 rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary lg:rounded-md lg:border-transparent lg:bg-transparent lg:px-3 lg:hover:bg-muted"
                    >
                      {g.category}
                      <span
                        data-numeric
                        className="text-xs text-muted-foreground"
                      >
                        {g.items.length}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="min-w-0 space-y-16 lg:col-span-9">
              {groups.map((g) => (
                <section
                  key={g.category}
                  id={slugify(g.category)}
                  aria-labelledby={`${slugify(g.category)}-title`}
                  className="scroll-mt-24"
                >
                  <h2
                    id={`${slugify(g.category)}-title`}
                    className="font-display text-display-sm text-foreground"
                  >
                    {g.category}
                  </h2>
                  <ServiceMenu items={g.items} anchors className="mt-5" />
                </section>
              ))}
            </div>
          </div>
        )}
      </Container>
    </MarketingPage>
  );
}
