"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS, type StepKey } from "./booking-state";

/**
 * Where the patient is in the four booking steps. Finished steps are buttons that jump back.
 * Phones get a one-line "Step 2 of 4" with a bar; wider screens get the full row.
 */
export function BookingProgress({
  current,
  reachable,
  onGo,
}: {
  current: StepKey;
  /** Steps the patient may jump to (already answered). */
  reachable: Set<StepKey>;
  onGo: (step: StepKey) => void;
}) {
  const index = STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <div className="sm:hidden">
        <p className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-foreground">
            {STEPS[index].label}
          </span>
          <span className="text-muted-foreground">
            Step {index + 1} of {STEPS.length}
          </span>
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="hidden items-center gap-2 sm:flex">
        {STEPS.map((step, i) => {
          const done = i < index;
          const active = i === index;
          const canGo = !active && reachable.has(step.key);
          const content = (
            <>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-accent text-accent-foreground",
                  !done && !active && "bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium group-hover:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </>
          );
          return (
            <li key={step.key} className="flex min-w-0 items-center gap-2">
              {canGo ? (
                <button
                  type="button"
                  onClick={() => onGo(step.key)}
                  className="group focus-ring -m-1 flex items-center gap-2 rounded-md p-1"
                >
                  {content}
                  <span className="sr-only">(change)</span>
                </button>
              ) : (
                <span
                  className="flex items-center gap-2"
                  aria-current={active ? "step" : undefined}
                >
                  {content}
                </span>
              )}
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px w-6 lg:w-10",
                    i < index ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
