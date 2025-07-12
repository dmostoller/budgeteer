"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchAPI, apiEndpoints } from "@/lib/api-utils";
import type {
  Expense,
  ExpenseFilters,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "@/types/expense";
import type { PaginatedResponse } from "@/types/pagination";
import { toast } from "sonner";

async function fetchExpenses(
  filters?: ExpenseFilters,
): Promise<PaginatedResponse<Expense[]>> {
  const params = new URLSearchParams();

  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());

  return fetchAPI<PaginatedResponse<Expense[]>>(
    apiEndpoints.expenses.list(params),
  );
}

async function createExpense(data: CreateExpenseInput): Promise<Expense> {
  return fetchAPI<Expense>(apiEndpoints.expenses.create(), {
    method: "POST",
    body: JSON.stringify({
      ...data,
      date: new Date(data.date),
    }),
  });
}

async function updateExpense({
  id,
  ...data
}: UpdateExpenseInput): Promise<Expense> {
  return fetchAPI<Expense>(apiEndpoints.expenses.update(id), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

async function deleteExpense(id: string): Promise<void> {
  return fetchAPI<void>(apiEndpoints.expenses.delete(id), {
    method: "DELETE",
  });
}

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: filters
      ? queryKeys.expensesFiltered({ ...filters } as Record<string, unknown>)
      : queryKeys.expenses(),
    queryFn: () => fetchExpenses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses() });

      // Snapshot the previous value
      const previousExpenses = queryClient.getQueryData(queryKeys.expenses());

      // For now, skip optimistic update for paginated data
      // We'll invalidate queries on success instead

      // Return a context object with the snapshotted value
      return { previousExpenses };
    },
    onError: (_err, _newExpense, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(queryKeys.expenses(), context?.previousExpenses);
      toast.error("Failed to create expense");
    },
    onSuccess: () => {
      toast.success("Expense created successfully");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExpense,
    onMutate: async (updatedExpense) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.expense(updatedExpense.id),
      });

      const previousExpense = queryClient.getQueryData(
        queryKeys.expense(updatedExpense.id),
      );

      queryClient.setQueryData(
        queryKeys.expense(updatedExpense.id),
        updatedExpense,
      );

      return { previousExpense };
    },
    onError: (_err, updatedExpense, context) => {
      queryClient.setQueryData(
        queryKeys.expense(updatedExpense.id),
        context?.previousExpense,
      );
      toast.error("Failed to update expense");
    },
    onSuccess: () => {
      toast.success("Expense updated successfully");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expense(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses() });

      const previousExpenses = queryClient.getQueryData(queryKeys.expenses());

      // For now, skip optimistic update for paginated data
      // We'll invalidate queries on success instead

      return { previousExpenses };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(queryKeys.expenses(), context?.previousExpenses);
      toast.error("Failed to delete expense");
    },
    onSuccess: () => {
      toast.success("Expense deleted successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() });
    },
  });
}
