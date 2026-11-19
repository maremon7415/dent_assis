"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  formatDuration,
  formatPrice,
  longDayLabel,
} from "@/components/portal/format";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { ServiceDTO } from "@/lib/actions/services";
import { cn } from "@/lib/utils";
import type { StepKey } from "./booking-state";

export type BookingAction = {
  label: string;
  disabled?: boolean;
  pending?: boolean;
  /** Submit this form id instead of calling onClick. */
  form?: string;
  onClick?: () => void;
};

function ActionButton({
  action,
  className,
}: {
  action: BookingAction;
  className?: string;
}) {
  return (
    <Button
      size="lg"
      type={action.form ? "submit" : "button"}
      form={action.form}
      onClick={action.form ? undefined : action.onClick}
      disabled={action.disabled || action.pending}
      aria-disabled={action.disabled || action.pending}
      className={cn("active:scale-[0.98]", className)}
    >
      {action.pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : null}
      {action.label}
      {!action.pending && !action.form ? (
        <ArrowRight className="size-4" aria-hidden />
      ) : null}
    </Button>
  );
}

function Row({
  label,
  value,
  sub,
  onChange,
}: {
  label: string;
  value: ReactNode | null;
  sub?: ReactNode;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd
          className={cn(
            "mt-0.5 text-sm",
            value ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {value ?? "Not chosen yet"}
          {value && sub ? (
            <span className="block font-normal text-muted-foreground">
              {sub}
            </span>
          ) : null}
        </dd>
      </div>
      {value && onChange ? (
        <button
          type="button"
          onClick={onChange}
          className="focus-ring shrink-0 rounded text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Change
          <span className="sr-only"> {label.toLowerCase()}</span>
        </button>
      ) : null}
    </div>
  );
}

export type SummaryProps = {
  service: ServiceDTO | null;
  dentist: string | null;
  dentistSub?: string | null;
  date: string | null;
  timeLabel: string | null;
  step: StepKey;
  onGo: (step: StepKey) => void;
  onBack: (() => void) | null;
  action: BookingAction | null;
};

/** Desktop: sticky "your visit" card beside the steps. */
export function BookingSummary(props: SummaryProps) {
  const { service, dentist, dentistSub, date, timeLabel, step, onGo, action } =
    props;
  const price = formatPrice(service?.priceCents);
  return (
    <aside
      aria-label="Your visit"
      className="sticky top-10 hidden self-start rounded-2xl border bg-card p-6 shadow-xs lg:block"
    >
      <h2 className="font-display text-xl text-foreground">Your visit</h2>
      <dl className="mt-2 divide-y">
        <Row
          label="Service"
          value={service?.name ?? null}
          sub={service ? formatDuration(service.durationMinutes) : null}
          onChange={step !== "service" ? () => onGo("service") : undefined}
        />
        <Row
          label="Dentist"
          value={dentist}
          sub={dentistSub}
          onChange={step !== "dentist" ? () => onGo("dentist") : undefined}
        />
        <Row
          label="When"
          value={date && timeLabel ? longDayLabel(date) : null}
          sub={timeLabel}
          onChange={step === "review" ? () => onGo("time") : undefined}
        />
      </dl>
      {price ? (
        <div className="mt-1 flex items-baseline justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">Estimated price</span>
          <span className="font-display text-2xl text-foreground" data-numeric>
            {price}
          </span>
        </div>
      ) : null}
      {action ? <ActionButton action={action} className="mt-6 w-full" /> : null}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Free to move or cancel online up to {siteConfig.clinic.minNoticeHours}{" "}
        hours before your visit.
      </p>
    </aside>
  );
}

/** Phones and tablets: a bar above the tab bar with the running summary and the next action. */
export function BookingActionBar(props: SummaryProps) {
  const { service, dentist, date, timeLabel, onBack, action } = props;
  // First step with nothing chosen: choosing a card already moves on, so the bar adds nothing.
  if (!onBack && (!action || action.disabled)) return null;
  const line = [
    service?.name,
    dentist,
    date && timeLabel ? `${longDayLabel(date)}, ${timeLabel}` : null,
  ].filter(Boolean);
  return (
    <div
      className="fixed inset-x-0 z-20 border-t bg-card/95 px-4 py-3 shadow-lg backdrop-blur-lg lg:hidden"
      style={{
        bottom: "calc(3.5rem + max(0.5rem, env(safe-area-inset-bottom)))",
      }}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        {onBack ? (
          <Button
            variant="outline"
            size="icon-lg"
            onClick={onBack}
            aria-label="Previous step"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Button>
        ) : null}
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {line.length ? (
            <span className="text-foreground">{line.join(", ")}</span>
          ) : (
            "Pick a service to start"
          )}
        </p>
        {action ? <ActionButton action={action} className="shrink-0" /> : null}
      </div>
    </div>
  );
}
