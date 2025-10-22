"use client";

import { createDoctor, getDoctors, updateDoctor } from "@/lib/actions/doctors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetDoctors() {
  const result = useQuery({
    queryKey: ["getDoctors"],
    queryFn: getDoctors,
  });

  return result;
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  const result = useMutation({
    mutationFn: createDoctor,
    //invalidates queries when doctor is created
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDoctors"] });
    },
    onError: () => console.log("doctor not created"),
  });

  return result;
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  const result = useMutation({
    mutationFn: updateDoctor,
    //invalidates queries when doctor is created
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDoctors"] });
    },
    onError: () => console.log("doctor not created"),
  });

  return result;
}
