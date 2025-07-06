"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { format } from "date-fns";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ExpenseCategory, IncomeCategory } from "@prisma/client";

interface Transaction {
  id?: string;
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: ExpenseCategory | IncomeCategory;
  isRecurring: boolean;
  merchantName?: string;
  isDuplicate: boolean;
  suggestedAction: "import" | "skip";
  selected?: boolean;
}

interface TransactionImportReviewProps {
  transactions: Transaction[];
  onImport: (transactions: Transaction[]) => Promise<void>;
  onCancel: () => void;
}

export function TransactionImportReview({
  transactions,
  onImport,
  onCancel,
}: TransactionImportReviewProps) {
  const [reviewedTransactions, setReviewedTransactions] = useState(
    transactions.map((t, index) => ({
      ...t,
      id: `temp-${index}`,
      selected: t.suggestedAction === "import",
    })),
  );
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleCategoryChange = (id: string, category: string) => {
    setReviewedTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, category: category as ExpenseCategory | IncomeCategory }
          : t,
      ),
    );
  };

  const handleTypeChange = (id: string, type: "income" | "expense") => {
    setReviewedTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          // Reset category when type changes
          const defaultCategory =
            type === "expense" ? ExpenseCategory.OTHER : IncomeCategory.OTHER;
          return {
            ...t,
            type,
            category: defaultCategory as ExpenseCategory | IncomeCategory,
          };
        }
        return t;
      }),
    );
  };

  const handleSelectChange = (id: string, selected: boolean) => {
    setReviewedTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected } : t)),
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setReviewedTransactions((prev) => prev.map((t) => ({ ...t, selected })));
  };

  const selectedCount = reviewedTransactions.filter((t) => t.selected).length;
  const duplicateCount = reviewedTransactions.filter(
    (t) => t.isDuplicate,
  ).length;

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const transactionsToImport = reviewedTransactions
        .filter((t) => t.selected)
        .map((t) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          isRecurring: t.isRecurring,
          merchantName: t.merchantName,
          isDuplicate: t.isDuplicate,
          suggestedAction: t.suggestedAction,
        }));

      await onImport(transactionsToImport);
      toast.success(
        `Successfully imported ${transactionsToImport.length} transactions`,
      );
    } catch (error) {
      toast.error("Failed to import transactions");
      console.error(error);
    } finally {
      setIsImporting(false);
      setShowConfirmDialog(false);
    }
  };

  const categories = (type: "income" | "expense") => {
    return type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Review Transactions</h3>
          <p className="text-sm text-muted-foreground">
            {transactions.length} transactions found • {selectedCount} selected
            for import
            {duplicateCount > 0 && ` • ${duplicateCount} potential duplicates`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSelectAll(false)}>
            Deselect All
          </Button>
          <Button variant="outline" onClick={() => handleSelectAll(true)}>
            Select All
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedCount === reviewedTransactions.length}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviewedTransactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className={transaction.isDuplicate ? "opacity-60" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={transaction.selected}
                    onCheckedChange={(checked) =>
                      handleSelectChange(transaction.id, !!checked)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {format(new Date(transaction.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    {transaction.merchantName && (
                      <p className="text-sm text-muted-foreground">
                        {transaction.merchantName}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  ${transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Select
                    value={transaction.type}
                    onValueChange={(value) =>
                      handleTypeChange(
                        transaction.id,
                        value as "income" | "expense",
                      )
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={transaction.category}
                    onValueChange={(value) =>
                      handleCategoryChange(transaction.id, value)
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories(transaction.type).map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {transaction.isDuplicate ? (
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Duplicate?
                    </Badge>
                  ) : transaction.isRecurring ? (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Recurring
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      New
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={selectedCount === 0 || isImporting}
        >
          Import {selectedCount} Transaction{selectedCount !== 1 ? "s" : ""}
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to import {selectedCount} transaction
              {selectedCount !== 1 ? "s" : ""}.
              {duplicateCount > 0 &&
                ` This includes ${duplicateCount} potential duplicate${duplicateCount !== 1 ? "s" : ""}.`}{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? "Importing..." : "Confirm Import"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
