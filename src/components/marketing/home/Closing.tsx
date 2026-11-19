import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Crescent, CrescentBullet } from "../Crescent";
import { FaqList } from "../FaqList";
import { faqById } from "../faq";
import { AI_FEATURES, FREE_FEATURES } from "../plans";
import { BandTitle, Container } from "../primitives";

export function PricingTeaser() {
  return (
    <section aria-labelledby="plans-title" className="py-20 lg:py-28">
      <Container>
        <BandTitle
          id="plans-title"
          title="Booking is free. The assistant is a plan."
          lede="Create an account to book and manage visits at no cost. Add an AI plan when you want answers by voice."
        />
        <div className="mt-12 grid overflow-hidden rounded-2xl border md:grid-cols-2">
          <div className="bg-card p-6 sm:p-8">
            <h3 className="font-display text-2xl text-foreground">
              Free account
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              For every patient
            </p>
            <ul className="mt-6 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-3 text-sm text-foreground">
                  <CrescentBullet />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden border-t bg-accent/50 p-6 sm:p-8 md:border-t-0 md:border-l">
            <Crescent
              phase={0.35}
              className="pointer-events-none absolute -right-10 -bottom-10 size-44"
              litClassName="fill-mint/40 dark:fill-mint/15"
            />
            <h3 className="font-display text-2xl text-foreground">AI plans</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              AI Basic and AI Pro
            </p>
            <ul className="relative mt-6 space-y-3">
              {AI_FEATURES.map((f) => (
                <li key={f} className="flex gap-3 text-sm text-foreground">
                  <CrescentBullet />
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild className="relative mt-8">
              <Link href="/pricing">
                Compare plans and prices
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

const TEASER_FAQ = ["cancel", "reminders", "ai-limits", "payment"];

export function FaqTeaser() {
  const items = TEASER_FAQ.map(faqById).filter((f) => f !== undefined);
  return (
    <section
      aria-labelledby="faq-title"
      className="border-t bg-card/50 py-20 lg:py-28"
    >
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <BandTitle
            id="faq-title"
            title="Good questions"
            lede="The ones patients ask the front desk most."
          />
          <Button asChild variant="link" className="mt-4 h-auto px-0 text-base">
            <Link href="/faq">
              All questions
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <FaqList items={items} className="lg:col-span-8" />
      </Container>
    </section>
  );
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** The last word: one line, one action, and the phone number for people who would rather call. */
export function FinalCta() {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative overflow-hidden border-t py-24 lg:py-32"
    >
      <Crescent
        phase={0.24}
        className="pointer-events-none absolute top-1/2 -right-40 size-[36rem] -translate-y-1/2 sm:-right-24"
        litClassName="fill-primary/10"
      />
      <Container className="relative">
        <h2
          id="cta-title"
          className="max-w-3xl font-display text-display-sm text-foreground sm:text-display-lg"
        >
          Your next check-up is a minute away.
        </h2>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className="h-12 px-7 text-base active:scale-[0.97]"
          >
            <Link href="/appointments">Book a visit</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="h-12 px-5 text-base"
          >
            <a href={telHref(siteConfig.phone)}>
              <Phone aria-hidden />
              Or call {siteConfig.phone}
            </a>
          </Button>
        </div>
      </Container>
    </section>
  );
}
