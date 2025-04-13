"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExpenseCategory, RecurrencePeriod } from "@prisma/client";
import { EXPENSE_CATEGORIES, RECURRENCE_PERIODS, CATEGORY_COLORS } from "@/lib/constants";

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
}

export function ExpenseTable({ data }: ExpenseTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  
  const getCategoryLabel = (value: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find(cat => cat.value === value)?.label || value;
  };
  
  const getRecurrencePeriodLabel = (value: RecurrencePeriod | null | undefined) => {
    if (!value) return "";
    return RECURRENCE_PERIODS.find(p => p.value === value)?.label || value;
  };

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div>{row.getValue("description")}</div>,
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
        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        return (
          <div>{format(new Date(row.getValue("date")), "MMM d, yyyy")}</div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as ExpenseCategory;
        const categoryColor = CATEGORY_COLORS[category];
        return (
          <Badge 
            style={{ backgroundColor: categoryColor, color: "white" }}
          >
            {getCategoryLabel(category)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isRecurring",
      header: "Recurring",
      cell: ({ row }) => {
        const isRecurring = row.getValue("isRecurring") as boolean;
        const recurrencePeriod = row.original.recurrencePeriod;

        if (!isRecurring) return <div>No</div>;
        
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline">Yes</Badge>
            <span className="text-xs text-muted-foreground">
              {getRecurrencePeriodLabel(recurrencePeriod)}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/spending/${row.original.id}/edit`)}
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
                    This will permanently delete this expense record. This action
                    cannot be undone.
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
                          }
                        );

                        if (!response.ok) {
                          throw new Error("Failed to delete expense");
                        }

                        toast.success("Expense deleted successfully");
                        router.refresh();
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
    state: {
      sorting,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
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
                            header.getContext()
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
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
      <div className="flex items-center justify-end space-x-2">
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
  );
}
