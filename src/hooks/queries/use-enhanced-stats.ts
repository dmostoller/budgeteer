"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchAPI, apiEndpoints } from "@/lib/api-utils";
import type {
  EnhancedStatsResponse,
  EnhancedStatsFilters,
} from "@/types/dashboard";

async function fetchEnhancedStats(
  filters: EnhancedStatsFilters,
): Promise<EnhancedStatsResponse> {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  return fetchAPI<EnhancedStatsResponse>(
    apiEndpoints.dashboard.enhancedStats(params),
  );
}

export function useEnhancedStats(filters: EnhancedStatsFilters) {
  return useQuery({
    queryKey: queryKeys.enhancedStats(filters),
    queryFn: () => fetchEnhancedStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(filters.startDate && filters.endDate), // Only run if we have both dates
  });
}
