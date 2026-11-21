"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import {
  adminCreateDoctor,
  adminListDoctors,
  adminUpdateDoctor,
} from "@/lib/actions/admin";
import {
  getActiveDoctors,
  getDoctorBySlug,
  getDoctorReviews,
} from "@/lib/actions/doctors";
import type { DoctorInput } from "@/lib/validation";
import { queryKeys } from "./query-keys";

export function useActiveDoctors(serviceId?: string) {
  return useQuery({
    queryKey: queryKeys.doctors.active(serviceId),
    queryFn: async () =>
      unwrap(await getActiveDoctors(serviceId ? { serviceId } : undefined)),
  });
}

export function useDoctorBySlug(slug: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.doctors.bySlug(slug ?? ""),
    queryFn: async () => unwrap(await getDoctorBySlug(slug as string)),
    enabled: !!slug,
  });
}

export function useDoctorReviews(doctorId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.doctors.reviews(doctorId ?? ""),
    queryFn: async () => unwrap(await getDoctorReviews(doctorId as string)),
    enabled: !!doctorId,
  });
}

function useInvalidateDoctors() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.doctors.all }),
      qc.invalidateQueries({ queryKey: queryKeys.admin.doctors() }),
      qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard() }),
    ]);
}

// ---------------- legacy names (current pages) ----------------

/** @deprecated use useActiveDoctors */
export function useAvailableDoctors() {
  return useActiveDoctors();
}

/**
 * @deprecated admin-only; use useAdminDoctors from use-admin.ts. Dates are revived to Date objects so the
 * current admin components (typed with Prisma's Doctor) keep compiling.
 */
export function useGetDoctors() {
  return useQuery({
    queryKey: [...queryKeys.admin.doctors(), "legacy"] as const,
    queryFn: async () =>
      unwrap(await adminListDoctors()).map((d) => ({
        ...d,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
      })),
  });
}

type LegacyDoctorFields = Pick<
  DoctorInput,
  "name" | "email" | "phone" | "speciality" | "gender" | "isActive"
>;

/** @deprecated use useAdminCreateDoctor from use-admin.ts */
export function useCreateDoctor() {
  const invalidate = useInvalidateDoctors();
  return useMutation({
    mutationFn: async (input: LegacyDoctorFields) =>
      unwrap(await adminCreateDoctor(input)),
    onSuccess: invalidate,
  });
}

/** @deprecated use useAdminUpdateDoctor from use-admin.ts */
export function useUpdateDoctor() {
  const invalidate = useInvalidateDoctors();
  return useMutation({
    // only the fields the old dialog edits; anything else on the object (slug, imageUrl, dates) is ignored
    mutationFn: async ({
      id,
      name,
      email,
      phone,
      speciality,
      gender,
      isActive,
    }: { id: string } & Partial<LegacyDoctorFields>) =>
      unwrap(
        await adminUpdateDoctor({
          id,
          name,
          email,
          phone,
          speciality,
          gender,
          isActive,
        }),
      ),
    onSuccess: invalidate,
  });
}
