// Dashboard Stats Types
export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface UpcomingPayment {
  id: string;
  name: string;
  amount: number;
  date: Date | string;
  type: "expense" | "subscription";
}

export interface CurrentMonthStats {
  name: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface DashboardStatsResponse {
  currentMonth: CurrentMonthStats;
  monthlyData: MonthlyData[];
  upcomingPayments: UpcomingPayment[];
}

export interface DashboardStatsFilters {
  date?: string; // YYYY-MM format
}

// Enhanced Stats Types
export interface IncomeDistribution {
  category: string;
  value: number;
}

export interface CashFlow {
  startBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface RecurringAnalysisData {
  month: string;
  recurringIncome: number;
  oneTimeIncome: number;
  recurringExpenses: number;
  oneTimeExpenses: number;
}

export interface CategoryTrendData {
  month: string;
  [category: string]: string | number;
}

export interface CategoryTrends {
  categories: string[];
  data: CategoryTrendData[];
}

export interface UpcomingRenewal {
  name: string;
  amount: number;
  date: Date | string;
}

export interface SubscriptionCategoryBreakdown {
  category: string;
  amount: number;
}

export interface SubscriptionAnalyticsData {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  upcomingRenewals: UpcomingRenewal[];
  categoryBreakdown: SubscriptionCategoryBreakdown[];
}

export interface ExpenseDistribution {
  category: string;
  value: number;
  percent: number;
}

export interface EnhancedStatsResponse {
  incomeDistribution: IncomeDistribution[];
  cashFlow: CashFlow;
  recurringAnalysis: RecurringAnalysisData[];
  categoryTrends: CategoryTrends;
  subscriptionAnalytics: SubscriptionAnalyticsData;
  expenseDistribution: ExpenseDistribution[];
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  monthlyData: MonthlyData[];
}

export interface EnhancedStatsFilters {
  startDate: string;
  endDate: string;
}
