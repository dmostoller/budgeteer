"use client";

import { ExpenseCategory, IncomeCategory } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_COLORS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/constants";

type FinanceEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "income" | "expense" | "subscription";
  category: IncomeCategory | ExpenseCategory;
  amount: number;
};

interface EventHoverCardProps {
  event: FinanceEvent;
  position: { x: number; y: number };
  onClose: () => void;
}

export function EventHoverCard({ event, position }: EventHoverCardProps) {
  const getCategoryLabel = (
    type: string,
    value: IncomeCategory | ExpenseCategory,
  ): string => {
    if (type === "income") {
      return (
        INCOME_CATEGORIES.find((cat) => cat.value === value)?.label ||
        String(value)
      );
    } else {
      return (
        EXPENSE_CATEGORIES.find((cat) => cat.value === value)?.label ||
        String(value)
      );
    }
  };

  const typeLabel =
    event.type === "income"
      ? "Income"
      : event.type === "expense"
        ? "Expense"
        : "Subscription";
  const categoryLabel = getCategoryLabel(event.type, event.category);
  const categoryColor = CATEGORY_COLORS[event.category];

  // Format amount as currency
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(event.amount);

  return (
    <div
      style={{
        position: "fixed",
        top: position.y + 10,
        left: position.x + 10,
        zIndex: 1000,
      }}
    >
      <div className="bg-card rounded-md border shadow-lg p-4 min-w-[250px]">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-md">{event.title}</h4>
            <Badge variant="outline">{typeLabel}</Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            {format(new Date(event.start), "MMMM d, yyyy")}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between">
              <span className="text-sm">Amount:</span>
              <span className="font-medium">{formattedAmount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Category:</span>
              <Badge style={{ backgroundColor: categoryColor, color: "white" }}>
                {categoryLabel}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
