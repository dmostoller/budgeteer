"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IncomeTable } from "@/components/tables/income-table";

interface IncomeContentProps {
  incomes: any[];
}

export function IncomeContent({ incomes }: IncomeContentProps) {
  const [pageSize, setPageSize] = useState(20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Income</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm font-medium">
              Show
            </label>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger id="page-size" className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm font-medium">entries</span>
          </div>
          <Link href="/dashboard/income/new" passHref>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Income
            </Button>
          </Link>
        </div>
      </div>
      <IncomeTable data={incomes} defaultPageSize={pageSize} />
    </div>
  );
}