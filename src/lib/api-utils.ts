export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const apiEndpoints = {
  expenses: {
    list: (params?: URLSearchParams) =>
      `/api/expenses${params ? `?${params}` : ""}`,
    create: () => "/api/expenses",
    update: (id: string) => `/api/expenses/${id}`,
    delete: (id: string) => `/api/expenses/${id}`,
  },
  categories: {
    list: () => "/api/categories",
  },
  budgets: {
    list: () => "/api/budgets",
    create: () => "/api/budgets",
    update: (id: string) => `/api/budgets/${id}`,
    delete: (id: string) => `/api/budgets/${id}`,
  },
  incomes: {
    list: () => "/api/incomes",
    create: () => "/api/incomes",
    update: (id: string) => `/api/incomes/${id}`,
    delete: (id: string) => `/api/incomes/${id}`,
  },
  dashboard: {
    stats: (date?: string) =>
      `/api/dashboard/stats${date ? `?date=${date}` : ""}`,
    enhancedStats: (params?: URLSearchParams) =>
      `/api/dashboard/enhanced-stats${params ? `?${params}` : ""}`,
  },
};
