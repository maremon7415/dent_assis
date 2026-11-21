"use client";

import { useQuery } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { getServices } from "@/lib/actions/services";
import { queryKeys } from "./query-keys";

export function useServices() {
  return useQuery({
    queryKey: queryKeys.services.active(),
    queryFn: async () => unwrap(await getServices()),
    staleTime: 5 * 60_000,
  });
}
