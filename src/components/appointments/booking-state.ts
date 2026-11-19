"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export const STEPS = [
  { key: "service", label: "Service" },
  { key: "dentist", label: "Dentist" },
  { key: "time", label: "Day & time" },
  { key: "review", label: "Review" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export const ANY_DENTIST = "any";

export interface BookingParams {
  service: string | null;
  /** dentist slug, or "any" */
  doctor: string | null;
  date: string | null;
  time: string | null;
  step: StepKey | null;
  confirmed: string | null;
}

const KEYS = [
  "service",
  "doctor",
  "date",
  "time",
  "step",
  "confirmed",
] as const satisfies readonly (keyof BookingParams)[];

/**
 * The booking flow keeps its whole state in the URL, so refresh, back/forward and shared links work.
 * Moving between steps pushes a history entry; picking a day or time replaces the current one.
 */
export function useBookingParams() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = useMemo<BookingParams>(() => {
    const raw = search.get("step");
    const step = STEPS.some((s) => s.key === raw) ? (raw as StepKey) : null;
    return {
      service: search.get("service"),
      doctor: search.get("doctor"),
      date: search.get("date"),
      time: search.get("time"),
      step,
      confirmed: search.get("confirmed"),
    };
  }, [search]);

  const update = useCallback(
    (
      patch: Partial<Record<keyof BookingParams, string | null>>,
      mode: "push" | "replace" = "replace",
    ) => {
      const next = new URLSearchParams();
      for (const key of KEYS) {
        const value = key in patch ? patch[key] : params[key];
        if (value) next.set(key, value);
      }
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [params, pathname, router],
  );

  return { params, update };
}
