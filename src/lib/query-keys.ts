export const queryKeys = {
  all: ["queries"] as const,

  // Expenses
  expenses: () => [...queryKeys.all, "expenses"] as const,
  expense: (id: string) => [...queryKeys.expenses(), id] as const,
  expensesFiltered: (filters: Record<string, unknown>) =>
    [...queryKeys.expenses(), "filtered", filters] as const,

  // Categories
  categories: () => [...queryKeys.all, "categories"] as const,
  category: (id: string) => [...queryKeys.categories(), id] as const,

  // Budgets
  budgets: () => [...queryKeys.all, "budgets"] as const,
  budget: (id: string) => [...queryKeys.budgets(), id] as const,
  budgetsByMonth: (month: string, year: string) =>
    [...queryKeys.budgets(), "month", { month, year }] as const,

  // Income
  incomes: () => [...queryKeys.all, "incomes"] as const,
  income: (id: string) => [...queryKeys.incomes(), id] as const,

  // Reports
  reports: () => [...queryKeys.all, "reports"] as const,
  monthlyReport: (month: string, year: string) =>
    [...queryKeys.reports(), "monthly", { month, year }] as const,
  yearlyReport: (year: string) =>
    [...queryKeys.reports(), "yearly", year] as const,

  // Dashboard
  dashboard: () => [...queryKeys.all, "dashboard"] as const,
  dashboardSummary: () => [...queryKeys.dashboard(), "summary"] as const,
  dashboardCharts: () => [...queryKeys.dashboard(), "charts"] as const,
  dashboardStats: (date?: string) =>
    date
      ? ([...queryKeys.dashboard(), "stats", date] as const)
      : ([...queryKeys.dashboard(), "stats"] as const),
  enhancedStats: (filters: { startDate: string; endDate: string }) =>
    [...queryKeys.dashboard(), "enhanced", filters] as const,
};
