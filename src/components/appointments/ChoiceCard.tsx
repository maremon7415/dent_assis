"use client";

import { Check, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One choice in a booking step. Choosing it moves to the next step. */
export function ChoiceCard({
  selected,
  disabled,
  onChoose,
  leading,
  title,
  meta,
  children,
  trailing,
}: {
  selected: boolean;
  disabled?: boolean;
  onChoose: () => void;
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onChoose}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "focus-ring group flex w-full items-start gap-4 rounded-xl border bg-card p-4 text-left shadow-xs transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out sm:p-5",
        "hover:border-primary/40 hover:shadow-sm active:scale-[0.99]",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:shadow-xs disabled:active:scale-100",
        selected && "border-primary bg-accent/35 ring-1 ring-primary",
      )}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-semibold text-foreground">{title}</span>
          {meta ? (
            <span className="text-sm text-muted-foreground">{meta}</span>
          ) : null}
        </span>
        {children ? (
          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
            {children}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2 self-stretch">
        {trailing}
        <span
          className={cn(
            "mt-auto flex size-6 items-center justify-center rounded-full transition-colors",
            selected
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground group-hover:text-primary",
          )}
          aria-hidden
        >
          {selected ? (
            <Check className="size-3.5" />
          ) : (
            <ChevronRight className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
          )}
        </span>
      </span>
    </button>
  );
}
