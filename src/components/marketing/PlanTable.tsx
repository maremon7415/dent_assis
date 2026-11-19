"use client";

import { PricingTable, SignUpButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Clerk's PricingTable is the source of truth for plan names, prices and checkout. When billing is
 * not configured (keyless development, or plans not yet published) it renders nothing or throws;
 * this wrapper then shows a plain next step instead of an empty hole.
 */
export function PlanTable() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      if (el.getBoundingClientRect().height > 80) setState("ready");
    };
    const ro = new ResizeObserver(check);
    ro.observe(el);
    check();
    // Give Clerk time to load its script and plans before concluding there is nothing to show.
    const timer = window.setTimeout(() => {
      setState((s) => (s === "loading" ? "empty" : s));
    }, 6000);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div aria-busy={state === "loading"} aria-live="polite">
      <div ref={ref} className={state === "empty" ? "hidden" : undefined}>
        <TableBoundary onError={() => setState("empty")}>
          <PricingTable newSubscriptionRedirectUrl="/voice" />
        </TableBoundary>
      </div>
      {state === "loading" ? <PlanSkeleton /> : null}
      {state === "empty" ? <PlanFallback /> : null}
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <span className="sr-only">Loading plans</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function PlanFallback() {
  const { isSignedIn } = useAuth();
  return (
    <div className="rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <p className="font-display text-xl text-foreground">
        Plan prices are not showing here
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Online checkout is not switched on yet. You can still create your free
        account and book now; the AI plans will appear here and in your portal
        as soon as they open.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {isSignedIn ? (
          <Button asChild>
            <Link href="/dashboard">Open portal</Link>
          </Button>
        ) : (
          <SignUpButton mode="modal" forceRedirectUrl="/appointments">
            <Button>Create a free account</Button>
          </SignUpButton>
        )}
        <Button asChild variant="outline">
          <Link href="/faq#ai-cost">How the plans work</Link>
        </Button>
      </div>
    </div>
  );
}

class TableBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
