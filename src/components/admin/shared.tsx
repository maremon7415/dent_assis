"use client";

import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import { ActionFailedError } from "@/lib/action-result";
import { cn } from "@/lib/utils";

/**
 * The clinic's timezone is a server setting (not NEXT_PUBLIC), so the admin layout passes it down.
 * Instants are always rendered in it, never in the browser's zone.
 */
export type ClinicContextValue = { timezone: string };
const ClinicContext = createContext<ClinicContextValue>({ timezone: "UTC" });
export const ClinicProvider = ClinicContext.Provider;
export const useClinic = () => useContext(ClinicContext);

export function useFormatInstant() {
  const { timezone } = useClinic();
  return (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(siteConfig.clinic.locale, {
      timeZone: timezone,
      ...opts,
    }).format(new Date(iso));
}

/** "YYYY-MM-DD" to a label without any timezone conversion. */
export function dayLabel(
  date: string,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(siteConfig.clinic.locale, {
    timeZone: "UTC",
    ...opts,
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  if (error instanceof ActionFailedError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function fieldError(error: unknown, field: string): string | undefined {
  if (error instanceof ActionFailedError)
    return error.fieldErrors?.[field]?.[0];
  return undefined;
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
/** Clinics work Monday first. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning/12 text-warning",
  CONFIRMED: "bg-info/12 text-info",
  COMPLETED: "bg-success/12 text-success",
  CANCELLED: "bg-muted text-muted-foreground",
  NO_SHOW: "bg-destructive/12 text-destructive",
  EXPIRED: "bg-muted text-muted-foreground",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
  EXPIRED: "Expired",
};

export function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}

export function StatusBadge({
  status,
  needsOutcome,
  className,
}: {
  status: string;
  needsOutcome?: boolean;
  className?: string;
}) {
  if (needsOutcome) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-coral/15 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-destructive",
          className,
        )}
      >
        <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
        Needs outcome
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLE[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export function QueryError({
  error,
  onRetry,
  title = "We could not load this",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
    >
      <AlertTriangle className="size-6 text-destructive" aria-hidden />
      <div>
        <p className="font-display text-lg">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {errorMessage(error)}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <p className="sr-only">Loading</p>
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  noun,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  noun: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav
      aria-label={`${noun} pages`}
      className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm"
    >
      <p className="text-muted-foreground" aria-live="polite" data-numeric>
        {from}-{to} of {total} {noun}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft aria-hidden />
          Previous
        </Button>
        <span
          className="px-2 whitespace-nowrap text-muted-foreground"
          data-numeric
        >
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}

/** A labelled section card used across the console. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border bg-card p-5 shadow-xs sm:p-6",
        className,
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function initials(name: string) {
  return name
    .replace(/^dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
