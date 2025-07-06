"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DateRange } from "react-day-picker";
import { DateRangeSelector } from "./date-range-selector";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export function DashboardDateRange() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get date range from URL params or use defaults
  const defaultFrom = startOfMonth(subMonths(new Date(), 2));
  const defaultTo = endOfMonth(new Date());
  
  const fromDate = searchParams.get("from") 
    ? new Date(searchParams.get("from")!) 
    : defaultFrom;
  const toDate = searchParams.get("to") 
    ? new Date(searchParams.get("to")!) 
    : defaultTo;

  const dateRange: DateRange = {
    from: fromDate,
    to: toDate,
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range || !range.from || !range.to) return;

    const params = new URLSearchParams(searchParams);
    params.set("from", range.from.toISOString());
    params.set("to", range.to.toISOString());
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <DateRangeSelector
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeChange}
    />
  );
}