import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { FaqList } from "@/components/marketing/FaqList";
import { ALL_FAQS, FAQ_GROUPS, faqJsonLd } from "@/components/marketing/faq";
import {
  Container,
  JsonLd,
  MarketingPage,
  PageIntro,
} from "@/components/marketing/primitives";
import { siteConfig } from "@/config/site";

const description = `Answers about booking, cancelling, reminders, the AI voice assistant, your privacy and paying for treatment at ${siteConfig.name}.`;

export const metadata: Metadata = {
  title: "Questions and answers",
  description,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: `Questions and answers · ${siteConfig.name}`,
    description,
    url: "/faq",
  },
};

export default function FaqPage() {
  return (
    <MarketingPage>
      <JsonLd data={faqJsonLd(ALL_FAQS)} />
      <Container className="pt-12 pb-10 sm:pt-16 lg:pt-20">
        <PageIntro
          title="Questions and answers"
          lede="What patients ask the front desk most, answered plainly. If yours is not here, call or write and a person will reply."
        />
      </Container>
      <Container className="grid gap-12 pb-24 lg:grid-cols-12 lg:gap-8">
        <nav aria-label="Topics" className="lg:col-span-3">
          <ul className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:flex-col lg:gap-0.5">
            {FAQ_GROUPS.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="focus-ring block rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary lg:rounded-md lg:border-transparent lg:bg-transparent lg:px-3 lg:hover:bg-muted"
                >
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16 lg:col-span-6">
          {FAQ_GROUPS.map((g) => (
            <section
              key={g.id}
              id={g.id}
              aria-labelledby={`${g.id}-title`}
              className="scroll-mt-24"
            >
              <h2
                id={`${g.id}-title`}
                className="font-display text-display-sm text-foreground"
              >
                {g.title}
              </h2>
              <FaqList items={g.items} className="mt-4" />
            </section>
          ))}
        </div>
        <aside aria-labelledby="ask-title" className="lg:col-span-3">
          <div className="rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
            <h2 id="ask-title" className="font-display text-xl text-foreground">
              Still wondering?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Call the front desk during opening hours, or write to us. A person
              reads every message.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                  className="focus-ring flex items-center gap-2.5 rounded-sm font-medium text-foreground hover:text-primary"
                >
                  <Phone className="size-4 text-primary" aria-hidden />
                  {siteConfig.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="focus-ring flex items-center gap-2.5 rounded-sm font-medium break-all text-foreground hover:text-primary"
                >
                  <Mail className="size-4 shrink-0 text-primary" aria-hidden />
                  {siteConfig.supportEmail}
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </Container>
    </MarketingPage>
  );
}
