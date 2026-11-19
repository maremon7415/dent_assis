"use client";

import { PricingTable } from "@clerk/nextjs";
import { Mail } from "lucide-react";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";

class Boundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[pricing] PricingTable failed", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function NoPlans() {
  return (
    <output className="flex flex-col items-start gap-4 rounded-2xl border border-dashed bg-card/60 p-6 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="font-display text-xl text-foreground">
          Plans aren't available online yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The clinic hasn't switched on online billing. Ask at the front desk or
          email us and we'll set up the assistant for you.
        </p>
      </div>
      <Button asChild variant="outline">
        <a
          href={`mailto:${siteConfig.supportEmail}?subject=AI%20assistant%20plan`}
        >
          <Mail className="size-4" aria-hidden />
          Email {siteConfig.supportEmail}
        </a>
      </Button>
    </output>
  );
}

/**
 * Clerk's pricing table. When billing isn't enabled for the Clerk instance the table renders nothing
 * (or throws), so after a grace period an empty container falls back to a contact message.
 */
export function PlansTable() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const rendered = el.querySelector("[class*='cl-'], button, h2, h3");
      if (rendered) setState("ready");
      return !!rendered;
    };
    const observer = new MutationObserver(() => {
      if (check()) observer.disconnect();
    });
    observer.observe(el, { childList: true, subtree: true });
    const timer = window.setTimeout(() => {
      if (!check()) setState("empty");
      observer.disconnect();
    }, 6000);
    check();
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Boundary fallback={<NoPlans />}>
      {state === "empty" ? <NoPlans /> : null}
      {state === "loading" ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          <output className="sr-only">Loading plans</output>
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : null}
      <div ref={ref} className={state === "ready" ? undefined : "hidden"}>
        <PricingTable />
      </div>
    </Boundary>
  );
}
