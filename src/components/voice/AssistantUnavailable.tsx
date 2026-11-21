import { Lock, Plug } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

/** The two states where no call can start: no plan, or the clinic hasn't connected the assistant. */
export function AssistantUnavailable({
  reason,
}: {
  reason: "plan" | "not-configured";
}) {
  const plan = reason === "plan";
  const Icon = plan ? Lock : Plug;
  return (
    <section
      aria-labelledby="assistant-unavailable-title"
      className="surface-glow flex flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center shadow-xs sm:py-16"
    >
      <div className="relative">
        <span className="flex size-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LogoMark className="size-10" />
        </span>
        <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-2 border-card bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <h2
        id="assistant-unavailable-title"
        className="mt-6 font-display text-2xl text-foreground"
      >
        {plan
          ? "The voice assistant is part of an AI plan"
          : "The voice assistant isn't switched on yet"}
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        {plan ? (
          "Choose a plan to talk to the assistant any time of day. Booking, your visits and your health profile stay free."
        ) : (
          <>
            {siteConfig.name} hasn't connected its voice assistant on this site
            yet. You can still book and manage visits, or call{" "}
            <span className="whitespace-nowrap">{siteConfig.phone}</span> with
            questions.
          </>
        )}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {plan ? (
          <Button asChild size="lg">
            <Link href="/pro">See plans</Link>
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline">
            <a href={`tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`}>
              Call {siteConfig.phone}
            </a>
          </Button>
        )}
        <Button asChild size="lg" variant={plan ? "outline" : "default"}>
          <Link href="/appointments">Book a visit</Link>
        </Button>
      </div>
    </section>
  );
}
