"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import {
  adminGetAppointments,
  adminUpdateAppointmentStatus,
} from "@/lib/actions/admin";
import {
  bookAppointment,
  cancelMyAppointment,
  getAvailableDays,
  getAvailableSlots,
  getBookedTimeSlots,
  getMyAppointments,
  getMyStats,
  rescheduleMyAppointment,
  submitReview,
} from "@/lib/actions/appointments";
import type {
  BookAppointmentInput,
  CancelInput,
  RescheduleInput,
  ReviewInput,
} from "@/lib/validation";
import { queryKeys } from "./query-keys";

/** After any booking change: the patient's lists, every cached slot/day grid, and admin views. */
function useInvalidateBookings() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.appointments.all }),
      qc.invalidateQueries({ queryKey: queryKeys.admin.all }),
      qc.invalidateQueries({ queryKey: queryKeys.doctors.all }),
    ]);
}

export function useMyAppointments() {
  return useQuery({
    queryKey: queryKeys.appointments.mine(),
    queryFn: async () => unwrap(await getMyAppointments()),
  });
}

export function useMyStats() {
  return useQuery({
    queryKey: queryKeys.appointments.myStats(),
    queryFn: async () => unwrap(await getMyStats()),
  });
}

export function useAvailableSlots(
  doctorId: string | null | undefined,
  date: string | null | undefined,
  serviceId?: string | null,
  excludeAppointmentId?: string,
) {
  return useQuery({
    queryKey: queryKeys.appointments.slots(
      doctorId,
      date,
      serviceId,
      excludeAppointmentId,
    ),
    queryFn: async () =>
      unwrap(
        await getAvailableSlots(
          doctorId as string,
          date as string,
          serviceId,
          excludeAppointmentId,
        ),
      ),
    enabled: !!doctorId && !!date,
    staleTime: 15_000,
  });
}

export function useAvailableDays(
  doctorId: string | null | undefined,
  serviceId?: string | null,
  from?: string,
  days?: number,
) {
  return useQuery({
    queryKey: queryKeys.appointments.days(doctorId, serviceId, from, days),
    queryFn: async () =>
      unwrap(
        await getAvailableDays({
          doctorId: doctorId as string,
          serviceId,
          from,
          days,
        }),
      ),
    enabled: !!doctorId,
    staleTime: 30_000,
  });
}

/** Errors are ActionFailedError; `error.code === "SLOT_TAKEN"` means refresh the slot grid. */
export function useBookAppointment() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: async (input: BookAppointmentInput) =>
      unwrap(await bookAppointment(input)),
    onSettled: invalidate,
  });
}

export function useRescheduleAppointment() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: async (input: RescheduleInput) =>
      unwrap(await rescheduleMyAppointment(input)),
    onSettled: invalidate,
  });
}

export function useCancelAppointment() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: async (input: CancelInput) =>
      unwrap(await cancelMyAppointment(input)),
    onSettled: invalidate,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReviewInput) => unwrap(await submitReview(input)),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.appointments.mine() }),
        qc.invalidateQueries({ queryKey: queryKeys.doctors.all }),
      ]),
  });
}

// ---------------- legacy hook names (current pages); prefer the hooks above ----------------

/** @deprecated use useMyAppointments (returns { upcoming, past }). Flat list, oldest first. */
export function useUserAppointments() {
  return useQuery({
    queryKey: [...queryKeys.appointments.mine(), "flat"] as const,
    queryFn: async () => {
      const { upcoming, past } = unwrap(await getMyAppointments());
      return [...[...past].reverse(), ...upcoming];
    },
  });
}

/** @deprecated use useAvailableSlots. Start times already taken for a doctor/date. */
export function useBookedTimeSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.appointments.booked(doctorId, date),
    queryFn: async () => unwrap(await getBookedTimeSlots(doctorId, date)),
    enabled: !!doctorId && !!date,
  });
}

/** @deprecated admin-only; use useAdminAppointments from use-admin.ts. Most recent 100. */
export function useGetAppointments() {
  return useQuery({
    queryKey: queryKeys.admin.appointments({ pageSize: 100 }),
    queryFn: async () =>
      unwrap(await adminGetAppointments({ pageSize: 100 })).items,
  });
}

/**
 * @deprecated use useAdminUpdateAppointmentStatus. Note: COMPLETED now requires a visit note and
 * COMPLETED -> CONFIRMED is no longer allowed, so the old toggle reports an error for those.
 */
export function useUpdateAppointmentStatus() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    }) =>
      unwrap(
        await adminUpdateAppointmentStatus({
          appointmentId: input.id,
          status: input.status,
        }),
      ),
    onSettled: invalidate,
  });
}
