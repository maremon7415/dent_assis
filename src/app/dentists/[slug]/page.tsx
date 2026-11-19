import { ArrowLeft, GraduationCap, Languages, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DoctorAvatar } from "@/components/marketing/DoctorAvatar";
import { DoctorRating } from "@/components/marketing/DoctorRating";
import { loadDoctor, loadReviews } from "@/components/marketing/data";
import {
  bookingHref,
  formatLocalDate,
  formatRange,
  groupedHours,
  shortDoctorName,
} from "@/components/marketing/format";
import {
  Container,
  DataUnavailable,
  JsonLd,
  MarketingPage,
} from "@/components/marketing/primitives";
import { ServiceMenu } from "@/components/marketing/ServiceMenu";
import { breadcrumbJsonLd, dentistJsonLd } from "@/components/marketing/seo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const res = await loadDoctor(slug);
  if (!res.ok)
    return {
      title: res.notFound ? "Dentist not found" : "Our dentists",
      robots: { index: false },
    };
  const d = res.doctor;
  const description = `${d.name}, ${d.speciality} at ${siteConfig.name}.${d.languages.length ? ` Speaks ${d.languages.join(", ")}.` : ""} See their treatments and working days, and book a visit online.`;
  return {
    title: `${d.name}, ${d.speciality}`,
    description,
    alternates: { canonical: `/dentists/${slug}` },
    openGraph: {
      type: "profile",
      title: `${d.name} · ${siteConfig.name}`,
      description,
      url: `/dentists/${slug}`,
    },
  };
}

export default async function DentistProfilePage({ params }: Props) {
  const { slug } = await params;
  const res = await loadDoctor(slug);
  if (!res.ok && res.notFound) notFound();
  if (!res.ok) {
    return (
      <MarketingPage>
        <Container className="py-20">
          <h1 className="sr-only">Dentist profile</h1>
          <DataUnavailable what="Dentist profiles" />
        </Container>
      </MarketingPage>
    );
  }
  const d = res.doctor;
  const reviews = await loadReviews(d.id);
  const short = shortDoctorName(d.name);
  const hours = groupedHours(d.schedule);

  return (
    <MarketingPage>
      <JsonLd data={dentistJsonLd(d)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Dentists", path: "/dentists" },
          { name: d.name, path: `/dentists/${slug}` },
        ])}
      />
      <Container className="pt-8 pb-24 sm:pt-10">
        <Link
          href="/dentists"
          className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All dentists
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <DoctorAvatar src={d.imageUrl} size="lg" />
              <div>
                <h1 className="font-display text-display-sm text-foreground sm:text-display-md">
                  {d.name}
                </h1>
                <p className="mt-2 text-base font-medium text-primary">
                  {d.speciality}
                </p>
                <DoctorRating rating={d.rating} className="mt-2" />
                <Button
                  asChild
                  size="lg"
                  className="mt-5 h-11 active:scale-[0.97] lg:hidden"
                >
                  <Link href={bookingHref({ doctor: d.slug })}>
                    Book with {short}
                  </Link>
                </Button>
              </div>
            </div>

            {d.bio ? (
              <p className="mt-10 max-w-2xl font-display text-xl leading-relaxed text-foreground sm:text-2xl sm:leading-snug">
                {d.bio}
              </p>
            ) : null}

            <dl className="mt-10 grid gap-6 border-y py-6 sm:grid-cols-3">
              {d.yearsExperience ? (
                <div>
                  <dt className="text-sm text-muted-foreground">In practice</dt>
                  <dd
                    data-numeric
                    className="mt-1 font-display text-2xl text-foreground"
                  >
                    {d.yearsExperience} years
                  </dd>
                </div>
              ) : null}
              {d.languages.length ? (
                <div>
                  <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Languages className="size-4" aria-hidden />
                    Languages
                  </dt>
                  <dd className="mt-1 text-base font-medium text-foreground">
                    {d.languages.join(", ")}
                  </dd>
                </div>
              ) : null}
              {d.education ? (
                <div className="sm:col-span-3 lg:col-span-1">
                  <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <GraduationCap className="size-4" aria-hidden />
                    Education
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-foreground">
                    {d.education}
                  </dd>
                </div>
              ) : null}
            </dl>

            <section aria-labelledby="treatments-title" className="mt-14">
              <h2
                id="treatments-title"
                className="font-display text-display-sm text-foreground"
              >
                Treatments with {short}
              </h2>
              {d.services.length ? (
                <ServiceMenu
                  items={d.services}
                  doctorSlug={d.slug}
                  compact
                  className="mt-5"
                />
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Treatments for {short} are being updated. Book a visit and
                  tell us what you need.
                </p>
              )}
            </section>

            <section aria-labelledby="reviews-title" className="mt-14">
              <h2
                id="reviews-title"
                className="font-display text-display-sm text-foreground"
              >
                What patients say
              </h2>
              {reviews === null ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Reviews could not be loaded right now.
                </p>
              ) : reviews.length === 0 ? (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  No reviews yet. Patients can review {short} after a completed
                  visit.
                </p>
              ) : (
                <ul className="mt-6 divide-y border-y">
                  {reviews.map((r) => (
                    <li key={r.id} className="py-6">
                      <p className="flex items-center gap-0.5">
                        <span className="sr-only">
                          Rated {r.rating} out of 5
                        </span>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            aria-hidden
                            className={
                              n <= r.rating
                                ? "size-4 fill-warning text-warning"
                                : "size-4 text-input"
                            }
                          />
                        ))}
                      </p>
                      {r.comment ? (
                        <blockquote className="mt-2 max-w-2xl text-base leading-relaxed text-foreground">
                          {r.comment}
                        </blockquote>
                      ) : null}
                      <p className="mt-2 text-sm text-muted-foreground">
                        {r.author},{" "}
                        <time dateTime={r.createdAt}>
                          {formatLocalDate(r.createdAt.slice(0, 10), {
                            month: "long",
                            year: "numeric",
                          })}
                        </time>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside
            aria-labelledby="book-title"
            className="lg:col-span-4 lg:col-start-9"
          >
            <div className="rounded-2xl border bg-card p-6 shadow-md lg:sticky lg:top-24">
              <h2
                id="book-title"
                className="font-display text-2xl text-foreground"
              >
                Book with {short}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a treatment, then choose from {short}&apos;s open times.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-5 h-12 w-full text-base active:scale-[0.97]"
              >
                <Link href={bookingHref({ doctor: d.slug })}>
                  Book with {short}
                </Link>
              </Button>

              <h3 className="mt-8 text-sm font-semibold text-foreground">
                Weekly hours
              </h3>
              <table className="mt-3 w-full text-sm">
                <caption className="sr-only">
                  Weekly hours, clinic local time
                </caption>
                <tbody>
                  {hours.map((h) => (
                    <tr key={h.key} className="border-t first:border-t-0">
                      <th
                        scope="row"
                        className="py-2 pr-4 text-left font-medium text-foreground"
                      >
                        {h.label}
                      </th>
                      <td className="py-2 text-right text-muted-foreground">
                        {h.ranges.length ? (
                          h.ranges.map((r) => (
                            <span key={r} className="block whitespace-nowrap">
                              {formatRange(r)}
                            </span>
                          ))
                        ) : (
                          <span>Not seeing patients</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                Clinic local time. Holidays may differ.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </MarketingPage>
  );
}
