import { Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import { Crescent } from "@/components/marketing/Crescent";
import { FaqList } from "@/components/marketing/FaqList";
import { faqById, faqJsonLd } from "@/components/marketing/faq";
import { PlanTable } from "@/components/marketing/PlanTable";
import { COMPARISON } from "@/components/marketing/plans";
import {
  BandTitle,
  Container,
  JsonLd,
  MarketingPage,
  PageIntro,
} from "@/components/marketing/primitives";
import { siteConfig } from "@/config/site";

const description = `Booking at ${siteConfig.name} is free. Add an AI plan for voice conversations with our dental assistant, any time of day. Compare what each plan includes.`;

export const metadata: Metadata = {
  title: "Pricing and AI plans",
  description,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: `Pricing and AI plans · ${siteConfig.name}`,
    description,
    url: "/pricing",
  },
};

const PRICING_FAQ = ["ai-cost", "ai-what", "ai-limits", "payment", "data"];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string")
    return <span className="text-sm text-muted-foreground">{value}</span>;
  return value ? (
    <>
      <Check className="mx-auto size-5 text-primary" aria-hidden />
      <span className="sr-only">Included</span>
    </>
  ) : (
    <>
      <Minus className="mx-auto size-5 text-muted-foreground/60" aria-hidden />
      <span className="sr-only">Not included</span>
    </>
  );
}

export default function PricingPage() {
  const faqs = PRICING_FAQ.map(faqById).filter((f) => f !== undefined);
  return (
    <MarketingPage>
      <JsonLd data={faqJsonLd(faqs)} />
      <section className="relative overflow-hidden">
        <Crescent
          phase={0.3}
          className="pointer-events-none absolute -top-32 -right-40 size-[30rem] sm:-right-20"
          litClassName="fill-mint/35 dark:fill-mint/15"
        />
        <Container className="relative pt-12 pb-14 sm:pt-16 lg:pt-20">
          <PageIntro
            title="Book for free. Ask by voice with a plan."
            lede="Your account, booking, reminders and visit history cost nothing. The AI plans add the voice assistant; choose one below and cancel whenever you like. Treatment itself is paid at the clinic."
          />
        </Container>
      </section>

      <section
        aria-labelledby="choose-title"
        className="border-t bg-card/50 py-20"
      >
        <Container>
          <BandTitle
            id="choose-title"
            title="Choose a plan"
            lede="Checkout is handled securely in your account. Your plan starts straight away and the assistant unlocks in the portal."
          />
          <div className="mt-10">
            <PlanTable />
          </div>
        </Container>
      </section>

      <section aria-labelledby="compare-title" className="py-20">
        <Container>
          <BandTitle id="compare-title" title="What is included" />
          <div className="relative mt-8 overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-left">
              <thead>
                <tr className="border-b">
                  <th
                    scope="col"
                    className="py-3 pr-4 text-sm font-medium text-muted-foreground"
                  >
                    <span className="sr-only">Feature</span>
                  </th>
                  <th
                    scope="col"
                    className="w-24 py-3 text-center font-display text-base sm:w-36 sm:text-lg font-normal text-foreground"
                  >
                    Free account
                  </th>
                  <th
                    scope="col"
                    className="w-24 py-3 text-center font-display text-base sm:w-36 sm:text-lg font-normal text-foreground"
                  >
                    AI plans
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label} className="border-b">
                    <th
                      scope="row"
                      className="py-4 pr-4 text-sm font-medium text-foreground"
                    >
                      {row.label}
                    </th>
                    <td className="py-4 text-center">
                      <Cell value={row.free} />
                    </td>
                    <td className="py-4 text-center">
                      <Cell value={row.ai} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="pricing-faq-title"
        className="border-t bg-card/50 py-20"
      >
        <Container className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <BandTitle id="pricing-faq-title" title="Questions about plans" />
          </div>
          <FaqList items={faqs} className="lg:col-span-8" />
        </Container>
      </section>
    </MarketingPage>
  );
}
