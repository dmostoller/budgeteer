import { PaginationParams } from "./pagination";

export type ExpenseCategory =
  | "HOUSING"
  | "FOOD"
  | "TRANSPORTATION"
  | "UTILITIES"
  | "ENTERTAINMENT"
  | "SUBSCRIPTIONS"
  | "HEALTHCARE"
  | "PERSONAL_CARE"
  | "DEBT_PAYMENT"
  | "OTHER";

export type RecurrencePeriod =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  isRecurring: boolean;
  recurrencePeriod?: RecurrencePeriod | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters extends PaginationParams {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
}

export interface CreateExpenseInput {
  description: string;
  amount: number;
  date: Date | string;
  category: ExpenseCategory;
  isRecurring?: boolean;
  recurrencePeriod?: RecurrencePeriod | null;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  id: string;
}
