"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchAPI, apiEndpoints } from "@/lib/api-utils";
import type {
  DashboardStatsResponse,
  DashboardStatsFilters,
} from "@/types/dashboard";

async function fetchDashboardStats(
  filters?: DashboardStatsFilters,
): Promise<DashboardStatsResponse> {
  return fetchAPI<DashboardStatsResponse>(
    apiEndpoints.dashboard.stats(filters?.date),
  );
}

export function useDashboardStats(filters?: DashboardStatsFilters) {
  return useQuery({
    queryKey: queryKeys.dashboardStats(filters?.date),
    queryFn: () => fetchDashboardStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
