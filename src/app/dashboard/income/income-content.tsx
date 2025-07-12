"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { IncomeTable } from "@/components/tables/income-table";
import { useIncomes } from "@/hooks/queries/use-incomes";

export function IncomeContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: response,
    isLoading,
    error,
  } = useIncomes({
    page,
    limit: pageSize,
  });

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Failed to load incomes</p>
      </div>
    );
  }

  // Transform the data to match IncomeTable format
  const tableData = (response?.data || []).map((income) => ({
    ...income,
    date: new Date(income.date),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Income</h1>
        <Link href="/dashboard/income/new" passHref>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </Link>
      </div>
      <IncomeTable
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
