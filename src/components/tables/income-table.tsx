"use client";

import { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";

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
import { IncomeCategory, RecurrencePeriod } from "@prisma/client";
import {
  INCOME_CATEGORIES,
  RECURRENCE_PERIODS,
  CATEGORY_COLORS,
} from "@/lib/constants";

export type Income = {
  id: string;
  source: string;
  amount: number;
  date: Date;
  category: IncomeCategory;
  isRecurring: boolean;
  recurrencePeriod?: RecurrencePeriod | null;
};

interface IncomeTableProps {
  data: Income[];
  defaultPageSize?: number;
}

export function IncomeTable({
  data: initialData,
  defaultPageSize = 20,
}: IncomeTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);
  const [updatingCategories, setUpdatingCategories] = useState<Set<string>>(
    new Set(),
  );
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageIndex, setPageIndex] = useState(0);

  // Update local data when props change (e.g., after adding new income)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Update page size when defaultPageSize prop changes
  useEffect(() => {
    if (pageSize !== defaultPageSize) {
      setPageSize(defaultPageSize);
      setPageIndex(0); // Reset to first page only when page size actually changes
    }
  }, [defaultPageSize, pageSize]);

  const getCategoryLabel = (value: IncomeCategory) => {
    return INCOME_CATEGORIES.find((cat) => cat.value === value)?.label || value;
  };

  const getRecurrencePeriodLabel = (
    value: RecurrencePeriod | null | undefined,
  ) => {
    if (!value) return "";
    return RECURRENCE_PERIODS.find((p) => p.value === value)?.label || value;
  };

  const handleCategoryChange = async (
    incomeId: string,
    newCategory: IncomeCategory,
  ) => {
    setUpdatingCategories((prev) => new Set(prev).add(incomeId));

    try {
      const response = await fetch(`/api/incomes/${incomeId}/category`, {
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
        prevData.map((income) =>
          income.id === incomeId
            ? { ...income, category: newCategory }
            : income,
        ),
      );

      toast.success("Category updated successfully");
    } catch (error) {
      toast.error("Failed to update category");
      console.error(error);
    } finally {
      setUpdatingCategories((prev) => {
        const newSet = new Set(prev);
        newSet.delete(incomeId);
        return newSet;
      });
    }
  };

  const columns: ColumnDef<Income>[] = [
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("source")}</div>
      ),
      size: 250,
      minSize: 200,
      maxSize: 300,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
        return <div className="font-medium text-right">{formatted}</div>;
      },
      size: 120,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        return (
          <div>{format(new Date(row.getValue("date")), "MMM d, yyyy")}</div>
        );
      },
      size: 120,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as IncomeCategory;
        const categoryColor = CATEGORY_COLORS[category];
        const incomeId = row.original.id;
        const isUpdating = updatingCategories.has(incomeId);

        return (
          <Select
            value={category}
            onValueChange={(value) =>
              handleCategoryChange(incomeId, value as IncomeCategory)
            }
            disabled={isUpdating}
          >
            <SelectTrigger
              className="w-[180px] border-0"
              style={{
                backgroundColor: categoryColor + "20",
                color: categoryColor,
              }}
            >
              <SelectValue>
                <span style={{ color: categoryColor, fontWeight: 500 }}>
                  {getCategoryLabel(category)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {INCOME_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.value] }}
                    />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "isRecurring",
      header: "Recurring",
      cell: ({ row }) => {
        const isRecurring = row.getValue("isRecurring") as boolean;
        const recurrencePeriod = row.original.recurrencePeriod;

        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit">
              {isRecurring ? "Yes" : "No"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getRecurrencePeriodLabel(recurrencePeriod)}
            </span>
          </div>
        );
      },
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.push(`/dashboard/income/${row.original.id}/edit`)
              }
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIncomeToDelete(row.original.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this income record. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIncomeToDelete(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (!incomeToDelete) return;
                      try {
                        const response = await fetch(
                          `/api/incomes/${incomeToDelete}`,
                          {
                            method: "DELETE",
                          },
                        );

                        if (!response.ok) {
                          throw new Error("Failed to delete income");
                        }

                        // Update local data instead of refreshing
                        setData((prevData) =>
                          prevData.filter(
                            (income) => income.id !== incomeToDelete,
                          ),
                        );

                        toast.success("Income deleted successfully");
                      } catch (error) {
                        toast.error("Something went wrong");
                        console.error(error);
                      } finally {
                        setIncomeToDelete(null);
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
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({ pageIndex, pageSize });
        setPageIndex(newPagination.pageIndex);
        setPageSize(newPagination.pageSize);
      }
    },
    state: {
      sorting,
      rowSelection,
      pagination: {
        pageSize,
        pageIndex,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
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
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
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
                  No income records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            data.length,
          )}{" "}
          of {data.length} results
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
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
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
  );
}
