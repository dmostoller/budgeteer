import { PaginationParams } from "./pagination";

export type IncomeCategory =
  | "SALARY"
  | "FREELANCE"
  | "BONUS"
  | "INVESTMENT"
  | "GIFT"
  | "OTHER";

export type RecurrencePeriod =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export interface Income {
  id: string;
  userId: string;
  source: string;
  amount: number;
  date: string;
  category: IncomeCategory;
  isRecurring: boolean;
  recurrencePeriod?: RecurrencePeriod | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeFilters extends PaginationParams {
  startDate?: string;
  endDate?: string;
  category?: IncomeCategory;
}

export interface CreateIncomeInput {
  source: string;
  amount: number;
  date: Date | string;
  category: IncomeCategory;
  isRecurring?: boolean;
  recurrencePeriod?: RecurrencePeriod | null;
}

export interface UpdateIncomeInput extends Partial<CreateIncomeInput> {
  id: string;
}
