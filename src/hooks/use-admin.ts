"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import {
  adminAddTimeOff,
  adminCreateDoctor,
  adminCreateService,
  adminDeactivateDoctor,
  adminGetAppointments,
  adminGetDashboardStats,
  adminGetDoctor,
  adminGetPatient,
  adminGetPatients,
  adminListDoctors,
  adminListServices,
  adminRemoveTimeOff,
  adminSetDoctorSchedule,
  adminUpdateAppointmentStatus,
  adminUpdateDoctor,
  adminUpdateService,
  adminUpsertVisitNote,
} from "@/lib/actions/admin";
import type {
  AdminAppointmentsQuery,
  AdminPatientsQuery,
  AdminUpdateStatusInput,
  AdminUpsertVisitNoteInput,
  DoctorInput,
  DoctorUpdateInput,
  ScheduleInput,
  ServiceInput,
  ServiceUpdateInput,
  TimeOffInput,
} from "@/lib/validation";
import { queryKeys } from "./query-keys";

function useInvalidate(...keys: (readonly unknown[])[]) {
  const qc = useQueryClient();
  return () =>
    Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: async () => unwrap(await adminGetDashboardStats()),
    refetchInterval: 60_000,
  });
}

export function useAdminAppointments(query: AdminAppointmentsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.admin.appointments(query),
    queryFn: async () => unwrap(await adminGetAppointments(query)),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUpdateAppointmentStatus() {
  const invalidate = useInvalidate(
    queryKeys.admin.all,
    queryKeys.appointments.all,
  );
  return useMutation({
    mutationFn: async (input: AdminUpdateStatusInput) =>
      unwrap(await adminUpdateAppointmentStatus(input)),
    onSettled: invalidate,
  });
}

export function useAdminUpsertVisitNote() {
  const invalidate = useInvalidate(
    queryKeys.admin.all,
    queryKeys.appointments.all,
  );
  return useMutation({
    mutationFn: async (input: AdminUpsertVisitNoteInput) =>
      unwrap(await adminUpsertVisitNote(input)),
    onSuccess: invalidate,
  });
}

export function useAdminDoctors() {
  return useQuery({
    queryKey: queryKeys.admin.doctors(),
    queryFn: async () => unwrap(await adminListDoctors()),
  });
}

export function useAdminDoctor(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.doctor(id ?? ""),
    queryFn: async () => unwrap(await adminGetDoctor(id as string)),
    enabled: !!id,
  });
}

const doctorKeys = [
  queryKeys.admin.doctors(),
  queryKeys.admin.dashboard(),
  queryKeys.doctors.all,
  queryKeys.appointments.all,
];

export function useAdminCreateDoctor() {
  const invalidate = useInvalidate(...doctorKeys);
  return useMutation({
    mutationFn: async (i: DoctorInput) => unwrap(await adminCreateDoctor(i)),
    onSuccess: invalidate,
  });
}

export function useAdminUpdateDoctor() {
  const invalidate = useInvalidate(...doctorKeys);
  return useMutation({
    mutationFn: async (i: DoctorUpdateInput) =>
      unwrap(await adminUpdateDoctor(i)),
    onSuccess: invalidate,
  });
}

export function useAdminDeactivateDoctor() {
  const invalidate = useInvalidate(...doctorKeys);
  return useMutation({
    mutationFn: async (id: string) => unwrap(await adminDeactivateDoctor(id)),
    onSuccess: invalidate,
  });
}

export function useAdminSetDoctorSchedule() {
  const invalidate = useInvalidate(...doctorKeys);
  return useMutation({
    mutationFn: async (i: ScheduleInput) =>
      unwrap(await adminSetDoctorSchedule(i)),
    onSuccess: invalidate,
  });
}

export function useAdminAddTimeOff() {
  const invalidate = useInvalidate(...doctorKeys);
  return useMutation({
    mutationFn: async (i: TimeOffInput) => unwrap(await adminAddTimeOff(i)),
    onSuccess: invalidate,
  });
}

export function useAdminRemoveTimeOff() {
  const invalidate = useInvalidate(...doctorKeys);
  return useMutation({
    mutationFn: async (id: string) => unwrap(await adminRemoveTimeOff(id)),
    onSuccess: invalidate,
  });
}

export function useAdminServices() {
  return useQuery({
    queryKey: queryKeys.admin.services(),
    queryFn: async () => unwrap(await adminListServices()),
  });
}

const serviceKeys = [
  queryKeys.admin.services(),
  queryKeys.services.all,
  queryKeys.doctors.all,
  queryKeys.admin.doctors(),
];

export function useAdminCreateService() {
  const invalidate = useInvalidate(...serviceKeys);
  return useMutation({
    mutationFn: async (i: ServiceInput) => unwrap(await adminCreateService(i)),
    onSuccess: invalidate,
  });
}

export function useAdminUpdateService() {
  const invalidate = useInvalidate(...serviceKeys);
  return useMutation({
    mutationFn: async (i: ServiceUpdateInput) =>
      unwrap(await adminUpdateService(i)),
    onSuccess: invalidate,
  });
}

export function useAdminPatients(query: AdminPatientsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.admin.patients(query),
    queryFn: async () => unwrap(await adminGetPatients(query)),
    placeholderData: keepPreviousData,
  });
}

export function useAdminPatient(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.patient(id ?? ""),
    queryFn: async () => unwrap(await adminGetPatient(id as string)),
    enabled: !!id,
  });
}
