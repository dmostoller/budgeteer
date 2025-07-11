import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

export interface TableMeta {
  filterVariant?: "text" | "range" | "select";
}

export interface EnhancedTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  defaultPageSize?: number;
  enableGlobalFilter?: boolean;
  enableColumnFilters?: boolean;
  enableSorting?: boolean;
  enableRowSelection?: boolean;
}

export interface TableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: Record<string, boolean>;
  globalFilter: string;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
}
