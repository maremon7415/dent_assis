"use client";

import { getAppointments } from "@/lib/actions/appointments";
import { useQuery } from "@tanstack/react-query";

export function useGetAppointment() {
  const result = useQuery({
    queryKey: ["getAppointment"],
    queryFn: getAppointments,
  });

  return result;
}
