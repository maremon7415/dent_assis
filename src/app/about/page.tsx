import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Crescent, CrescentBullet } from "@/components/marketing/Crescent";
import { loadDoctors } from "@/components/marketing/data";
import {
  BandTitle,
  Container,
  MarketingPage,
  PageIntro,
} from "@/components/marketing/primitives";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

const description = `Why ${siteConfig.name} exists, what we believe good dental care looks like, how we use AI responsibly, and how to reach the clinic.`;

export const metadata: Metadata = {
  title: "About the clinic",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About · ${siteConfig.name}`,
    description,
    url: "/about",
  },
};

const VALUES = [
  {
    title: "Explain before we treat",
    body: "You hear what we found, what the options are and what each one costs before anything starts. Saying no, or not yet, is always an option.",
  },
  {
    title: "Your time is part of the care",
    body: "The diary you book from is the diary we work from, so the time you choose is the time you are seen. Reminders arrive before you need them.",
  },
  {
    title: "Gentle by default",
    body: "Nervous patients, children and people who have not seen a dentist in years get the same unhurried visit. Ask for a pause at any point.",
  },
];

const AI_RULES = [
  "The assistant gives general guidance and says so. It never diagnoses or prescribes.",
  "It is not given your records, X-rays or appointments.",
  "It points you to a dentist, or to emergency care, whenever that is the safer answer.",
  "Every decision about your treatment is made by a dentist who has examined you.",
];

function tel(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default async function AboutPage() {
  const doctors = await loadDoctors();
  const languages = doctors
    ? [...new Set(doctors.flatMap((d) => d.languages))].sort((a, b) =>
        a.localeCompare(b),
      )
    : [];

  return (
    <MarketingPage>
      <section className="relative overflow-hidden">
        <Crescent
          phase={0.18}
          className="pointer-events-none absolute -top-24 -right-48 size-[34rem] sm:-right-24"
          litClassName="fill-mint/35 dark:fill-mint/15"
        />
        <Container className="relative pt-12 pb-20 sm:pt-16 lg:pt-24">
          <PageIntro
            title="A clinic that answers back"
            lede={`${siteConfig.name} started from a simple frustration: dental care is easy to put off when booking means a phone queue and questions mean waiting for an appointment. So we opened the diary to patients and gave the clinic a voice that is there at any hour.`}
          />
          {doctors && doctors.length > 0 ? (
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-foreground">
              Today {doctors.length} dentist{doctors.length === 1 ? "" : "s"}{" "}
              practise here
              {languages.length > 1
                ? `, and between them they speak ${languages.slice(0, -1).join(", ")} and ${languages.at(-1)}`
                : ""}
              .
            </p>
          ) : null}
        </Container>
      </section>

      <section
        aria-labelledby="values-title"
        className="border-t bg-card/50 py-20 lg:py-28"
      >
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <BandTitle id="values-title" title="What we hold to" />
          </div>
          <dl className="divide-y border-y lg:col-span-8">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="grid gap-2 py-7 sm:grid-cols-[14rem_1fr] sm:gap-8"
              >
                <dt className="font-display text-xl leading-snug text-foreground">
                  {v.title}
                </dt>
                <dd className="text-base leading-relaxed text-muted-foreground">
                  {v.body}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section
        aria-labelledby="ai-title"
        className="dark relative overflow-hidden bg-background py-20 text-foreground lg:py-28"
      >
        <Crescent
          phase={0.16}
          className="pointer-events-none absolute -bottom-48 -left-56 size-[36rem]"
          litClassName="fill-mint/10"
        />
        <Container className="relative grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <BandTitle
              id="ai-title"
              title="How we use AI, and where we stop"
              lede="The voice assistant helps you understand and decide when to come in. It does not replace the dentist."
            />
            <Button asChild variant="outline" className="mt-6">
              <Link href="/faq#assistant">Questions about the assistant</Link>
            </Button>
          </div>
          <ul className="space-y-5 lg:col-span-6 lg:col-start-7">
            {AI_RULES.map((r) => (
              <li
                key={r}
                className="flex gap-4 text-lg leading-relaxed text-foreground"
              >
                <CrescentBullet className="mt-2 size-4" />
                {r}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="visit-title" className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <BandTitle
              id="visit-title"
              title="Visit or get in touch"
              lede="Book online any time, or call during opening hours and the front desk will help."
            />
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 px-7 text-base active:scale-[0.97]"
            >
              <Link href="/appointments">Book a visit</Link>
            </Button>
          </div>
          <address className="grid gap-px overflow-hidden rounded-2xl border bg-border not-italic sm:grid-cols-3 lg:col-span-7">
            <div className="bg-card p-6">
              <MapPin className="size-5 text-primary" aria-hidden />
              <p className="mt-4 text-sm font-semibold text-foreground">
                Address
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {siteConfig.address}
              </p>
            </div>
            <div className="bg-card p-6">
              <Phone className="size-5 text-primary" aria-hidden />
              <p className="mt-4 text-sm font-semibold text-foreground">
                Phone
              </p>
              <a
                href={tel(siteConfig.phone)}
                className="focus-ring mt-1 block rounded-sm text-sm text-muted-foreground hover:text-foreground"
              >
                {siteConfig.phone}
              </a>
            </div>
            <div className="bg-card p-6">
              <Mail className="size-5 text-primary" aria-hidden />
              <p className="mt-4 text-sm font-semibold text-foreground">
                Email
              </p>
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="focus-ring mt-1 block rounded-sm text-sm break-all text-muted-foreground hover:text-foreground"
              >
                {siteConfig.supportEmail}
              </a>
            </div>
          </address>
        </Container>
      </section>
    </MarketingPage>
  );
}
