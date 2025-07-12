"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchAPI, apiEndpoints } from "@/lib/api-utils";
import type {
  Income,
  IncomeFilters,
  CreateIncomeInput,
  UpdateIncomeInput,
} from "@/types/income";
import type { PaginatedResponse } from "@/types/pagination";
import { toast } from "sonner";

async function fetchIncomes(
  filters?: IncomeFilters,
): Promise<PaginatedResponse<Income[]>> {
  const params = new URLSearchParams();

  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());

  return fetchAPI<PaginatedResponse<Income[]>>(
    apiEndpoints.incomes.list() + (params.toString() ? `?${params}` : ""),
  );
}

async function createIncome(data: CreateIncomeInput): Promise<Income> {
  return fetchAPI<Income>(apiEndpoints.incomes.create(), {
    method: "POST",
    body: JSON.stringify({
      ...data,
      date: new Date(data.date),
    }),
  });
}

async function updateIncome({
  id,
  ...data
}: UpdateIncomeInput): Promise<Income> {
  return fetchAPI<Income>(apiEndpoints.incomes.update(id), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

async function deleteIncome(id: string): Promise<void> {
  return fetchAPI<void>(apiEndpoints.incomes.delete(id), {
    method: "DELETE",
  });
}

export function useIncomes(filters?: IncomeFilters) {
  return useQuery({
    queryKey: filters
      ? [...queryKeys.incomes(), "filtered", filters]
      : queryKeys.incomes(),
    queryFn: () => fetchIncomes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIncome,
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.incomes() });

      // Snapshot the previous value
      const previousIncomes = queryClient.getQueryData(queryKeys.incomes());

      // For now, skip optimistic update for paginated data
      // We'll invalidate queries on success instead

      // Return a context object with the snapshotted value
      return { previousIncomes };
    },
    onError: (err, newIncome, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(queryKeys.incomes(), context?.previousIncomes);
      toast.error("Failed to create income");
    },
    onSuccess: () => {
      toast.success("Income created successfully");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes() });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateIncome,
    onMutate: async (updatedIncome) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.income(updatedIncome.id),
      });

      const previousIncome = queryClient.getQueryData(
        queryKeys.income(updatedIncome.id),
      );

      queryClient.setQueryData(
        queryKeys.income(updatedIncome.id),
        updatedIncome,
      );

      return { previousIncome };
    },
    onError: (err, updatedIncome, context) => {
      queryClient.setQueryData(
        queryKeys.income(updatedIncome.id),
        context?.previousIncome,
      );
      toast.error("Failed to update income");
    },
    onSuccess: () => {
      toast.success("Income updated successfully");
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.income(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes() });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteIncome,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.incomes() });

      const previousIncomes = queryClient.getQueryData(queryKeys.incomes());

      // For now, skip optimistic update for paginated data
      // We'll invalidate queries on success instead

      return { previousIncomes };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(queryKeys.incomes(), context?.previousIncomes);
      toast.error("Failed to delete income");
    },
    onSuccess: () => {
      toast.success("Income deleted successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes() });
    },
  });
}
