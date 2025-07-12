"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  SortingState,
  useReactTable,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { format, isAfter, isBefore, addDays } from "date-fns";
import {
  AlertCircle,
  Edit,
  Trash2,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { usePrivacy } from "@/contexts/privacy-context";
import { formatCurrencyWithPrivacy } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BillingCycle, ExpenseCategory } from "@prisma/client";
import { BILLING_CYCLES } from "@/lib/constants";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Filter, ActiveFilters } from "@/components/ui/table-filter";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextPaymentDate: Date;
  category: ExpenseCategory;
};

interface SubscriptionTableProps {
  data: Subscription[];
}

export function SubscriptionTable({ data }: SubscriptionTableProps) {
  const router = useRouter();
  const { isPrivacyMode } = usePrivacy();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [pageIndex, setPageIndex] = useState(0);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<
    string | null
  >(null);

  // Reset page index when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [columnFilters, globalFilter]);

  const getBillingCycleLabel = (value: BillingCycle) => {
    return (
      BILLING_CYCLES.find((cycle) => cycle.value === value)?.label || value
    );
  };

  const columns = useMemo<ColumnDef<Subscription>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = formatCurrencyWithPrivacy(amount, isPrivacyMode);
        return <div className="font-medium">{formatted}</div>;
      },
      enableColumnFilter: true,
      filterFn: "inNumberRange",
    },
    {
      accessorKey: "billingCycle",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Billing Cycle
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const billingCycle = row.getValue("billingCycle") as BillingCycle;
        return <div>{getBillingCycleLabel(billingCycle)}</div>;
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return value === "" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "nextPaymentDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Next Payment
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("nextPaymentDate"));
        const today = new Date();
        const isUpcoming =
          isAfter(date, today) && isBefore(date, addDays(today, 7));
        const isPast = isBefore(date, today);

        return (
          <div className="flex items-center gap-2">
            {format(date, "MMM d, yyyy")}
            {isUpcoming && (
              <Badge className="ml-2 bg-yellow-500">
                <AlertCircle className="mr-1 h-3 w-3" />
                Soon
              </Badge>
            )}
            {isPast && (
              <Badge className="ml-2 bg-red-500">
                <AlertCircle className="mr-1 h-3 w-3" />
                Overdue
              </Badge>
            )}
          </div>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.push(`/dashboard/subscriptions/${row.original.id}/edit`)
              }
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSubscriptionToDelete(row.original.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this subscription. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setSubscriptionToDelete(null)}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (!subscriptionToDelete) return;
                      try {
                        const response = await fetch(
                          `/api/subscriptions/${subscriptionToDelete}`,
                          {
                            method: "DELETE",
                          },
                        );

                        if (!response.ok) {
                          throw new Error("Failed to delete subscription");
                        }

                        toast.success("Subscription deleted successfully");
                        router.refresh();
                      } catch (error) {
                        toast.error("Something went wrong");
                        console.error(error);
                      } finally {
                        setSubscriptionToDelete(null);
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ], [isPrivacyMode, router]);

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
        pageSize,
        pageIndex,
      },
    },
    enableRowSelection: true,
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
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <DebouncedInput
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(value) => setGlobalFilter(String(value))}
              className="h-9 w-[250px] pl-8"
              debounce={300}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ActiveFilters table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
            {/* Separate row for filters */}
            <TableRow>
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <TableHead key={header.id} className="p-2">
                  {header.column.getCanFilter() ? (
                    <Filter column={header.column} table={table} />
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No subscriptions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
