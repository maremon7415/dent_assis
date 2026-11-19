"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "@/hooks/query-keys";
import { unwrap } from "@/lib/action-result";
import {
  getAvailableDays,
  getAvailableSlots,
} from "@/lib/actions/appointments";

export interface GridDay {
  date: string;
  slots: number;
  doctorIds: string[];
}

export interface GridSlot {
  time: string;
  label: string;
  startsAt: string;
  /** Dentists free at this time, in the order given. The first one is used for "any dentist". */
  doctorIds: string[];
}

/**
 * Availability for one or more dentists (one = a chosen dentist, several = "any available dentist"),
 * merged into one day list and one time list. Uses the same query keys as useAvailableDays and
 * useAvailableSlots, so booking invalidation refreshes it.
 */
export function useSlotGrid({
  doctorIds,
  serviceId,
  date,
  excludeAppointmentId,
}: {
  doctorIds: string[];
  serviceId?: string | null;
  date?: string | null;
  excludeAppointmentId?: string;
}) {
  const dayQueries = useQueries({
    queries: doctorIds.map((doctorId) => ({
      queryKey: queryKeys.appointments.days(doctorId, serviceId),
      queryFn: async () =>
        unwrap(await getAvailableDays({ doctorId, serviceId })),
      staleTime: 30_000,
    })),
  });

  const days = useMemo(() => {
    const byDate = new Map<string, GridDay>();
    dayQueries.forEach((q, i) => {
      for (const d of q.data ?? []) {
        if (d.slots <= 0) continue;
        const entry = byDate.get(d.date) ?? {
          date: d.date,
          slots: 0,
          doctorIds: [],
        };
        entry.slots += d.slots;
        entry.doctorIds.push(doctorIds[i]);
        byDate.set(d.date, entry);
      }
    });
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [dayQueries, doctorIds]);

  const daysLoading = dayQueries.some((q) => q.isPending);
  const daysError = dayQueries.find((q) => q.isError)?.error ?? null;

  // Only ask dentists who have openings that day (all of them until days have loaded).
  const doctorsForDate = useMemo(() => {
    if (!date) return [];
    const day = days.find((d) => d.date === date);
    return day ? day.doctorIds : daysLoading ? doctorIds : [];
  }, [date, days, daysLoading, doctorIds]);

  const slotQueries = useQueries({
    queries: doctorsForDate.map((doctorId) => ({
      queryKey: queryKeys.appointments.slots(
        doctorId,
        date,
        serviceId,
        excludeAppointmentId,
      ),
      queryFn: async () =>
        unwrap(
          await getAvailableSlots(
            doctorId,
            date as string,
            serviceId,
            excludeAppointmentId,
          ),
        ),
      staleTime: 15_000,
      enabled: !!date,
    })),
  });

  const slots = useMemo(() => {
    const byTime = new Map<string, GridSlot>();
    slotQueries.forEach((q, i) => {
      for (const s of q.data ?? []) {
        const entry = byTime.get(s.time) ?? {
          time: s.time,
          label: s.label,
          startsAt: s.startsAt,
          doctorIds: [],
        };
        entry.doctorIds.push(doctorsForDate[i]);
        byTime.set(s.time, entry);
      }
    });
    return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
  }, [slotQueries, doctorsForDate]);

  return {
    days,
    daysLoading,
    daysError,
    refetchDays: () => Promise.all(dayQueries.map((q) => q.refetch())),
    daysFetching: dayQueries.some((q) => q.isFetching),
    slots,
    slotsLoading: !!date && slotQueries.some((q) => q.isPending),
    slotsError: slotQueries.find((q) => q.isError)?.error ?? null,
    slotsFetching: slotQueries.some((q) => q.isFetching),
    refetchSlots: () => Promise.all(slotQueries.map((q) => q.refetch())),
  };
}
