"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { getMyProfile, updateMyProfile } from "@/lib/actions/profile";
import type { ProfileInput } from "@/lib/validation";
import { queryKeys } from "./query-keys";

export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.profile.mine(),
    queryFn: async () => unwrap(await getMyProfile()),
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileInput) =>
      unwrap(await updateMyProfile(input)),
    onSuccess: (profile) => qc.setQueryData(queryKeys.profile.mine(), profile),
  });
}
