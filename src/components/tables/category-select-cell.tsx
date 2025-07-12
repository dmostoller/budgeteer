"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IncomeCategory, ExpenseCategory } from "@prisma/client";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
} from "@/lib/constants";

interface CategorySelectCellProps<T extends IncomeCategory | ExpenseCategory> {
  category: T;
  onCategoryChange: (category: T) => void;
  isUpdating: boolean;
  type: "income" | "expense";
}

export function CategorySelectCell<T extends IncomeCategory | ExpenseCategory>({
  category,
  onCategoryChange,
  isUpdating,
  type,
}: CategorySelectCellProps<T>) {
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const categoryColor = CATEGORY_COLORS[category];

  const getCategoryLabel = (value: string) => {
    return categories.find((cat) => cat.value === value)?.label || value;
  };

  return (
    <Select
      value={category}
      onValueChange={(value) => onCategoryChange(value as T)}
      disabled={isUpdating}
    >
      <SelectTrigger
        className="w-[150px] h-8 border-0 text-xs"
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
        {categories.map((cat) => (
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
}
