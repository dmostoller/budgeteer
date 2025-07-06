import {
  BillingCycle,
  ExpenseCategory,
  IncomeCategory,
  RecurrencePeriod,
} from "@prisma/client";

export const INCOME_CATEGORIES = [
  { value: IncomeCategory.SALARY, label: "Salary" },
  { value: IncomeCategory.FREELANCE, label: "Freelance" },
  { value: IncomeCategory.BONUS, label: "Bonus" },
  { value: IncomeCategory.INVESTMENT, label: "Investment" },
  { value: IncomeCategory.GIFT, label: "Gift" },
  { value: IncomeCategory.OTHER, label: "Other" },
];

export const EXPENSE_CATEGORIES = [
  { value: ExpenseCategory.HOUSING, label: "Housing" },
  { value: ExpenseCategory.FOOD, label: "Food" },
  { value: ExpenseCategory.TRANSPORTATION, label: "Transportation" },
  { value: ExpenseCategory.UTILITIES, label: "Utilities" },
  { value: ExpenseCategory.ENTERTAINMENT, label: "Entertainment" },
  { value: ExpenseCategory.SUBSCRIPTIONS, label: "Subscriptions" },
  { value: ExpenseCategory.HEALTHCARE, label: "Healthcare" },
  { value: ExpenseCategory.PERSONAL_CARE, label: "Personal Care" },
  { value: ExpenseCategory.DEBT_PAYMENT, label: "Debt Payment" },
  { value: ExpenseCategory.OTHER, label: "Other" },
];

export const RECURRENCE_PERIODS = [
  { value: RecurrencePeriod.DAILY, label: "Daily" },
  { value: RecurrencePeriod.WEEKLY, label: "Weekly" },
  { value: RecurrencePeriod.MONTHLY, label: "Monthly" },
  { value: RecurrencePeriod.QUARTERLY, label: "Quarterly" },
  { value: RecurrencePeriod.YEARLY, label: "Yearly" },
];

export const BILLING_CYCLES = [
  { value: BillingCycle.MONTHLY, label: "Monthly" },
  { value: BillingCycle.YEARLY, label: "Yearly" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  // Income categories
  [IncomeCategory.SALARY]: "#4ade80",
  [IncomeCategory.FREELANCE]: "#38bdf8",
  [IncomeCategory.BONUS]: "#a78bfa",
  [IncomeCategory.INVESTMENT]: "#2dd4bf",
  [IncomeCategory.GIFT]: "#fb923c",
  // Income OTHER uses a different color
  income_OTHER: "#94a3b8",

  // Expense categories
  [ExpenseCategory.HOUSING]: "#ef4444",
  [ExpenseCategory.FOOD]: "#f97316",
  [ExpenseCategory.TRANSPORTATION]: "#facc15",
  [ExpenseCategory.UTILITIES]: "#8b5cf6",
  [ExpenseCategory.ENTERTAINMENT]: "#ec4899",
  [ExpenseCategory.SUBSCRIPTIONS]: "#06b6d4",
  [ExpenseCategory.HEALTHCARE]: "#10b981",
  [ExpenseCategory.PERSONAL_CARE]: "#f43f5e",
  [ExpenseCategory.DEBT_PAYMENT]: "#6366f1",
  [ExpenseCategory.OTHER]: "#64748b",
};
