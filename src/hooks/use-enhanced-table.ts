"use client";

import { useEffect, useState } from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  useReactTable,
} from "@tanstack/react-table";
import { EnhancedTableProps } from "@/types/table";

export function useEnhancedTable<TData>({
  data,
  columns,
  defaultPageSize = 20,
  enableGlobalFilter = true,
  enableColumnFilters = true,
  enableSorting = true,
  enableRowSelection = false,
}: EnhancedTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageIndex, setPageIndex] = useState(0);

  // Reset page index when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [columnFilters, globalFilter]);

  // Update page size when defaultPageSize prop changes
  useEffect(() => {
    if (pageSize !== defaultPageSize) {
      setPageSize(defaultPageSize);
      setPageIndex(0);
    }
  }, [defaultPageSize, pageSize]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({ pageIndex, pageSize });
        setPageIndex(newPagination.pageIndex);
        setPageSize(newPagination.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel:
      enableColumnFilters || enableGlobalFilter
        ? getFilteredRowModel()
        : undefined,
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: enableColumnFilters ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableColumnFilters
      ? getFacetedUniqueValues()
      : undefined,
    getFacetedMinMaxValues: enableColumnFilters
      ? getFacetedMinMaxValues()
      : undefined,
  });

  return {
    table,
    globalFilter,
    setGlobalFilter,
    pageSize,
    setPageSize,
    pageIndex,
    setPageIndex,
  };
}
