"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Crescent } from "@/components/marketing/Crescent";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

/**
 * Route error boundary. Renders inside the root layout (fonts, theme, Clerk stay), without the
 * marketing header so it can never itself be the thing that failed.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col items-start justify-center px-4 py-24 sm:px-6 lg:px-8"
    >
      <Crescent phase={0.08} outline className="size-20 text-primary" />
      <h1 className="mt-8 font-display text-display-sm text-foreground sm:text-display-md">
        Something went wrong on our side
      </h1>
      <p
        className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground"
        role="alert"
      >
        The page did not load. Try again; if it keeps happening, call the front
        desk on{" "}
        <a
          href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
          className="focus-ring rounded-sm font-medium text-primary underline"
        >
          {siteConfig.phone}
        </a>
        .
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Reference {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Go to the home page</Link>
        </Button>
      </div>
    </main>
  );
}
