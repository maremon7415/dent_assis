import type { Metadata } from "next";
import Link from "next/link";
import { DoctorAvatar } from "@/components/marketing/DoctorAvatar";
import { DoctorRating } from "@/components/marketing/DoctorRating";
import { loadDoctors } from "@/components/marketing/data";
import { bookingHref, shortDoctorName } from "@/components/marketing/format";
import {
  Container,
  DataUnavailable,
  JsonLd,
  MarketingPage,
  PageIntro,
} from "@/components/marketing/primitives";
import { breadcrumbJsonLd } from "@/components/marketing/seo";
import { WeekStrip } from "@/components/marketing/WeekStrip";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

const description = `Meet the ${siteConfig.name} dentists: their specialities, languages, working days and the treatments each one offers. Book with the dentist you choose.`;

export const metadata: Metadata = {
  title: "Our dentists",
  description,
  alternates: { canonical: "/dentists" },
  openGraph: {
    title: `Our dentists · ${siteConfig.name}`,
    description,
    url: "/dentists",
  },
};

export default async function DentistsPage() {
  const doctors = await loadDoctors();

  return (
    <MarketingPage>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Dentists", path: "/dentists" },
        ])}
      />
      <Container className="pt-12 pb-10 sm:pt-16 lg:pt-20">
        <PageIntro
          title="Our dentists"
          lede="Choose by what you need, the language you are most comfortable in, or the days that suit you. Every dentist books from the same live diary."
        />
      </Container>

      <Container className="pb-24">
        {doctors === null ? (
          <DataUnavailable what="Dentist profiles" />
        ) : doctors.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center">
            <p className="font-display text-xl text-foreground">
              Our team page is being updated
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Call {siteConfig.phone} and the front desk will match you with the
              right dentist.
            </p>
          </div>
        ) : (
          <ul className="divide-y border-y">
            {doctors.map((d) => {
              const profile = d.slug ? `/dentists/${d.slug}` : null;
              return (
                <li
                  key={d.id}
                  className="grid gap-6 py-8 lg:grid-cols-12 lg:items-center lg:gap-8"
                >
                  <div className="flex items-start gap-5 lg:col-span-6">
                    <DoctorAvatar
                      src={d.imageUrl}
                      size="md"
                      className="sm:size-20"
                    />
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl leading-tight text-foreground">
                        {profile ? (
                          <Link
                            href={profile}
                            className="focus-ring rounded-sm hover:text-primary"
                          >
                            {d.name}
                          </Link>
                        ) : (
                          d.name
                        )}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-primary">
                        {d.speciality}
                        {d.yearsExperience ? (
                          <span className="font-normal text-muted-foreground">
                            , {d.yearsExperience} years in practice
                          </span>
                        ) : null}
                      </p>
                      {d.bio ? (
                        <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                          {d.bio}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        <DoctorRating rating={d.rating} />
                        {d.languages.length ? (
                          <p>Speaks {d.languages.join(", ")}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <WeekStrip
                    schedule={d.schedule}
                    className="pl-21 sm:pl-25 lg:col-span-2 lg:pl-0"
                  />
                  <div className="flex flex-wrap gap-2 pl-21 sm:pl-25 lg:col-span-4 lg:pl-0 lg:justify-end">
                    {profile ? (
                      <Button asChild variant="outline">
                        <Link href={profile}>
                          View profile
                          <span className="sr-only">: {d.name}</span>
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild className="active:scale-[0.97]">
                      <Link href={bookingHref({ doctor: d.slug })}>
                        Book with {shortDoctorName(d.name)}
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </MarketingPage>
  );
}
