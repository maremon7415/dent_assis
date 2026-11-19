import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Crescent } from "../Crescent";
import type { NextOpening } from "../data";
import { NextOpeningCard } from "../NextOpeningCard";
import { Container } from "../primitives";

/**
 * One job: get the visitor to book (or try the assistant). The right column is the product itself,
 * the clinic's real next opening, set against the brand's crescent of light.
 */
export function Hero({
  opening,
  dentistCount,
  serviceCount,
}: {
  opening: NextOpening | null;
  dentistCount: number;
  serviceCount: number;
}) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        aria-hidden
        className="surface-glow pointer-events-none absolute inset-0"
      />
      <Container className="relative grid items-center gap-12 pt-10 pb-16 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pt-20 lg:pb-24">
        <div className="lg:col-span-7">
          <h1
            id="hero-title"
            className="font-display text-[2.75rem] leading-[1.02] tracking-[-0.03em] text-foreground sm:text-display-lg xl:text-display-xl"
          >
            {siteConfig.tagline.replace(/\.$/, "")}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Book the right dentist in under a minute from the clinic&apos;s real
            diary, and ask our AI voice assistant anything about your teeth, day
            or night.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
              variant="outline"
              className="h-12 px-7 text-base active:scale-[0.97]"
            >
              <Link href="/voice">Try the AI assistant</Link>
            </Button>
          </div>
          {dentistCount > 0 && serviceCount > 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">
              {dentistCount} dentist{dentistCount === 1 ? "" : "s"} and{" "}
              {serviceCount} treatments under one roof, at {siteConfig.address}.
            </p>
          ) : null}
        </div>

        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <Crescent
            phase={0.2}
            className="animate-in fade-in zoom-in-95 fill-mode-both pointer-events-none absolute -top-16 -right-24 size-[26rem] duration-1000 sm:-right-16 lg:-top-24 lg:-right-20 lg:size-[34rem]"
            litClassName="fill-mint/45 dark:fill-mint/20"
          />
          <NextOpeningCard opening={opening} className="relative" />
        </div>
      </Container>
    </section>
  );
}
