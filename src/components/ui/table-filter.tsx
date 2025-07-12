"use client";

import { Column } from "@tanstack/react-table";
import { DebouncedInput } from "@/components/ui/debounced-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { format } from "date-fns";

import { Table } from "@tanstack/react-table";

interface FilterProps<TData> {
  column: Column<TData, unknown>;
  table: Table<TData>;
}

export function Filter<TData>({ column, table }: FilterProps<TData>) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = column.getFacetedUniqueValues
    ? Array.from(column.getFacetedUniqueValues().keys()).sort()
    : [];

  // Check if this is a date column
  const isDateColumn =
    firstValue instanceof Date ||
    (typeof firstValue === "string" &&
      !isNaN(Date.parse(firstValue)) &&
      column.id === "date") ||
    column.id === "nextPaymentDate";

  // Check if this is an amount column (handle cases where amount might be a string)
  const isAmountColumn = column.id === "amount";

  if (typeof firstValue === "number" || isAmountColumn) {
    return (
      <div className="flex gap-1 justify-end">
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={(columnFilterValue as [number, number])?.[0] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [value, old?.[1]])
          }
          placeholder="Min"
          className="w-20 h-8 text-xs"
        />
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={(columnFilterValue as [number, number])?.[1] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [old?.[0], value])
          }
          placeholder="Max"
          className="w-20 h-8 text-xs"
        />
      </div>
    );
  } else if (isDateColumn) {
    // For date columns, use a date range picker
    return (
      <DateRangeFilter
        value={columnFilterValue as [Date, Date] | undefined}
        onChange={(value) => column.setFilterValue(value)}
        placeholder="Select dates..."
        className="w-full"
      />
    );
  } else if (column.id === "description" || column.id === "source" || column.id === "name") {
    // Force search input for specific columns that should always be searchable
    return (
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? "") as string}
        onChange={(value) => column.setFilterValue(value)}
        placeholder="Search..."
        className="w-full h-8 text-xs"
      />
    );
  } else if (sortedUniqueValues.length > 0 && sortedUniqueValues.length <= 10) {
    return (
      <Select
        value={(columnFilterValue as string) || "all"}
        onValueChange={(value) =>
          column.setFilterValue(value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {sortedUniqueValues.map((value, index) => (
            <SelectItem key={`${String(value)}-${index}`} value={String(value)}>
              {String(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else {
    return (
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? "") as string}
        onChange={(value) => column.setFilterValue(value)}
        placeholder="Search..."
        className="w-full h-8 text-xs"
      />
    );
  }
}

interface ActiveFiltersProps<TData> {
  table: Table<TData>;
}

// Helper function to extract header label
function getHeaderLabel<TData>(
  column: Column<TData, unknown> | undefined,
  fallbackId: string,
): string {
  if (!column?.columnDef?.header) return fallbackId;

  const header = column.columnDef.header;
  if (typeof header === "string") {
    return header;
  }

  // If header is a function, use the column id as fallback
  return fallbackId;
}

export function ActiveFilters<TData>({ table }: ActiveFiltersProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  if (!isFiltered) return null;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      <div className="flex flex-wrap gap-2">
        {table
          .getState()
          .columnFilters.map((filter: { id: string; value: unknown }) => {
            const column = table.getColumn(filter.id);
            const filterValue = filter.value;
            const label = getHeaderLabel(column, filter.id);

            return (
              <Badge key={filter.id} variant="secondary" className="gap-1">
                <span className="font-medium">{label}:</span>
                <span>
                  {Array.isArray(filterValue)
                    ? filterValue[0] instanceof Date
                      ? `${format(filterValue[0], "MMM d")} - ${format(filterValue[1], "MMM d, yyyy")}`
                      : `${filterValue[0]} - ${filterValue[1]}`
                    : String(filterValue)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => column?.setFilterValue(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.resetColumnFilters()}
          className="h-6 px-2"
        >
          Clear all
        </Button>
      </div>
    </div>
  );
}
