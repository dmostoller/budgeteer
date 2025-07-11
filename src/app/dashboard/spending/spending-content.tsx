"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ExpenseTable } from "@/components/tables/expense-table";
import { useExpenses } from "@/hooks/queries/use-expenses";

export function SpendingContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: response,
    isLoading,
    error,
  } = useExpenses({
    page,
    limit: pageSize,
  });

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Failed to load expenses</p>
      </div>
    );
  }

  // Transform the data to match ExpenseTable format
  const tableData = (response?.data || []).map((expense) => ({
    ...expense,
    date: new Date(expense.date),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Spending</h1>
        <Link href="/dashboard/spending/new" passHref>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </Link>
      </div>
      <ExpenseTable
        data={tableData}
        totalCount={response?.totalCount || 0}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
      />
    </div>
  );
}
