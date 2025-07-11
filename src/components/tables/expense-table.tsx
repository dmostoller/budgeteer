"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  SortingState,
  useReactTable,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExpenseCategory, RecurrencePeriod } from "@prisma/client";
import { CategorySelectCell } from "@/components/tables/category-select-cell";
import { RecurringSelectCell } from "@/components/tables/recurring-select-cell";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Filter, ActiveFilters } from "@/components/ui/table-filter";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  isRecurring: boolean;
  recurrencePeriod?: RecurrencePeriod | null;
};

interface ExpenseTableProps {
  data: Expense[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

export function ExpenseTable({
  data: initialData,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: ExpenseTableProps) {
  const router = useRouter();
  const { isPrivacyMode } = usePrivacy();
  const [data, setData] = useState(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [updatingCategories, setUpdatingCategories] = useState<Set<string>>(
    new Set(),
  );
  const [updatingRecurring, setUpdatingRecurring] = useState<Set<string>>(
    new Set(),
  );

  // Update local data when props change (e.g., after adding new expense)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleCategoryChange = async (
    expenseId: string,
    newCategory: ExpenseCategory,
  ) => {
    setUpdatingCategories((prev) => new Set(prev).add(expenseId));

    try {
      const response = await fetch(`/api/expenses/${expenseId}/category`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category: newCategory }),
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      // Update local data instead of refreshing
      setData((prevData) =>
        prevData.map((expense) =>
          expense.id === expenseId
            ? { ...expense, category: newCategory }
            : expense,
        ),
      );

      toast.success("Category updated successfully");
    } catch (error) {
      toast.error("Failed to update category");
      console.error(error);
    } finally {
      setUpdatingCategories((prev) => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    }
  };

  const handleRecurringChange = async (
    expenseId: string,
    isRecurring: boolean,
  ) => {
    setUpdatingRecurring((prev) => new Set(prev).add(expenseId));

    try {
      const response = await fetch(`/api/expenses/${expenseId}/recurring`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRecurring }),
      });

      if (!response.ok) {
        throw new Error("Failed to update recurring status");
      }

      // Update local data instead of refreshing
      setData((prevData) =>
        prevData.map((expense) =>
          expense.id === expenseId
            ? {
                ...expense,
                isRecurring,
                // Clear recurrence period if not recurring
                recurrencePeriod: isRecurring ? expense.recurrencePeriod : null,
              }
            : expense,
        ),
      );

      toast.success("Recurring status updated successfully");
    } catch (error) {
      toast.error("Failed to update recurring status");
      console.error(error);
    } finally {
      setUpdatingRecurring((prev) => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    }
  };

  const columns = useMemo<ColumnDef<Expense>[]>(() => [
    {
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Description
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
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("description")}</div>
      ),
      size: 250,
      minSize: 200,
      maxSize: 300,
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 data-[state=open]:bg-accent"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
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
          </div>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = formatCurrencyWithPrivacy(amount, isPrivacyMode);
        return <div className="font-medium text-right">{formatted}</div>;
      },
      size: 120,
      enableColumnFilter: true,
      filterFn: "inNumberRange",
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
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
        return (
          <div>{format(new Date(row.getValue("date")), "MMM d, yyyy")}</div>
        );
      },
      size: 120,
      sortingFn: "datetime",
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || !Array.isArray(value) || value.length !== 2) return true;
        const date = new Date(row.getValue(id));
        const [start, end] = value;
        return date >= start && date <= end;
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => {
        return (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 data-[state=open]:bg-accent"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Category
              {column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-1 h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-1 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3" />
              )}
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const category = row.getValue("category") as ExpenseCategory;
        const expenseId = row.original.id;
        const isUpdating = updatingCategories.has(expenseId);

        return (
          <CategorySelectCell
            category={category}
            onCategoryChange={(newCategory) =>
              handleCategoryChange(expenseId, newCategory)
            }
            isUpdating={isUpdating}
            type="expense"
          />
        );
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return value === "" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "isRecurring",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Recurring
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
        const isRecurring = row.getValue("isRecurring") as boolean;
        const recurrencePeriod = row.original.recurrencePeriod;
        const expenseId = row.original.id;
        const isUpdating = updatingRecurring.has(expenseId);

        return (
          <RecurringSelectCell
            isRecurring={isRecurring}
            recurrencePeriod={recurrencePeriod}
            onRecurringChange={(value) =>
              handleRecurringChange(expenseId, value)
            }
            isUpdating={isUpdating}
          />
        );
      },
      size: 100,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const isRecurring = row.getValue(id);
        if (value === "true") return isRecurring === true;
        if (value === "false") return isRecurring === false;
        return true;
      },
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
                router.push(`/dashboard/spending/${row.original.id}/edit`)
              }
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpenseToDelete(row.original.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this expense record. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setExpenseToDelete(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (!expenseToDelete) return;
                      try {
                        const response = await fetch(
                          `/api/expenses/${expenseToDelete}`,
                          {
                            method: "DELETE",
                          },
                        );

                        if (!response.ok) {
                          throw new Error("Failed to delete expense");
                        }

                        // Update local data instead of refreshing
                        setData((prevData) =>
                          prevData.filter(
                            (expense) => expense.id !== expenseToDelete,
                          ),
                        );

                        toast.success("Expense deleted successfully");
                      } catch (error) {
                        toast.error("Something went wrong");
                        console.error(error);
                      } finally {
                        setExpenseToDelete(null);
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
      size: 100,
    },
  ], [isPrivacyMode, updatingCategories, updatingRecurring, router]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
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
                    <TableHead
                      key={header.id}
                      className={
                        header.column.id === "amount" ? "text-right" : ""
                      }
                    >
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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  No expense records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{" "}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                onPageSizeChange(Number(value));
                onPageChange(1); // Reset to first page when changing page size
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {Math.ceil(totalCount / pageSize)}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalCount / pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
