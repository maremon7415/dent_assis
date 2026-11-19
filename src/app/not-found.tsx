import type { Metadata } from "next";
import Link from "next/link";
import { Crescent } from "@/components/marketing/Crescent";
import { Container, MarketingPage } from "@/components/marketing/primitives";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** A new moon: the crescent with no light in it. */
export default function NotFound() {
  return (
    <MarketingPage>
      <Container className="flex flex-col items-start py-24 sm:py-32">
        <Crescent phase={0} outline className="size-20 text-primary" />
        <h1 className="mt-8 font-display text-display-sm text-foreground sm:text-display-md">
          This page is not here
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
          The link may be old, or the page may have moved. Everything you need
          to book or ask a question is one step away.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">Go to the home page</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dentists">Find a dentist</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/faq">Read the FAQ</Link>
          </Button>
        </div>
      </Container>
    </MarketingPage>
  );
}
