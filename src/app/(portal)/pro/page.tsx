import { auth } from "@clerk/nextjs/server";
import { AudioLines, CalendarCheck2, Clock3, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { PlansTable } from "@/components/voice/PlansTable";

export const metadata: Metadata = {
  title: "AI assistant plans",
  robots: { index: false },
};

const POINTS = [
  {
    icon: AudioLines,
    title: "Talk, don't type",
    body: "A natural voice conversation about treatments, aftercare and preparing for a visit.",
  },
  {
    icon: Clock3,
    title: "Any time of day",
    body: "Ask the questions that come up at night or on a weekend, when the front desk is closed.",
  },
  {
    icon: ShieldCheck,
    title: "Honest about limits",
    body: "General guidance only. It tells you when something needs a dentist, and never diagnoses.",
  },
];

export default async function ProPage() {
  // Signed-out visitors are sent to sign in by the proxy (src/proxy.ts).
  const { has } = await auth();
  const hasPlan = has({ plan: "ai_basic" }) || has({ plan: "ai_pro" });

  return (
    <>
      <PageHeader
        title="AI assistant plans"
        description="Add the voice assistant to your account. Booking, your visits and your health profile are free on every plan."
        actions={
          hasPlan ? (
            <Button asChild size="lg">
              <Link href="/voice">
                <AudioLines className="size-4" aria-hidden />
                Open the assistant
              </Link>
            </Button>
          ) : null
        }
      />

      <ul className="mb-10 grid gap-4 sm:grid-cols-3">
        {POINTS.map((p) => (
          <li key={p.title} className="flex gap-4 sm:flex-col sm:gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <p.icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-foreground">
                {p.title}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <section aria-labelledby="plans-title">
        <h2
          id="plans-title"
          className="mb-5 font-display text-2xl text-foreground"
        >
          Choose a plan
        </h2>
        <PlansTable />
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarCheck2
            className="size-4 shrink-0 text-primary"
            aria-hidden
          />
          Dental treatment is paid at the clinic. These plans cover the
          assistant only.
        </p>
      </section>
    </>
  );
}
