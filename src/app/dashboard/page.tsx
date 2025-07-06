import { SummaryStats } from "@/components/dashboard/summary-stats";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { ExpenseDistributionChart } from "@/components/dashboard/expense-distribution-chart";
import { SavingsTrendChart } from "@/components/dashboard/savings-trend-chart";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { DashboardDateRange } from "@/components/dashboard/dashboard-date-range";
import { IncomeDistributionChart } from "@/components/dashboard/income-distribution-chart";
import { CashFlowWaterfallChart } from "@/components/dashboard/cash-flow-waterfall-chart";
import { RecurringAnalysisChart } from "@/components/dashboard/recurring-analysis-chart";
import { CategoryTrendChart } from "@/components/dashboard/category-trend-chart";
import { SubscriptionAnalytics } from "@/components/dashboard/subscription-analytics";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachMonthOfInterval,
} from "date-fns";

export const dynamic = "force-dynamic";

async function fetchDashboardData(
  userId: string,
  startDate: Date,
  endDate: Date,
) {
  // Get income total for date range
  const incomeTotal = await prisma.income.aggregate({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Get expense total for date range
  const expenseTotal = await prisma.expense.aggregate({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Get monthly data for the selected date range
  const monthlyData = [];
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  for (const month of months) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthName = format(month, "MMM yyyy");

    // Calculate month income
    const monthIncome = await prisma.income.aggregate({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate month expenses
    const monthExpenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const monthIncomeAmount = Number(monthIncome._sum.amount || 0);
    const monthExpensesAmount = Number(monthExpenses._sum.amount || 0);
    monthlyData.push({
      month: monthName,
      income: monthIncomeAmount,
      expenses: monthExpensesAmount,
      savings: monthIncomeAmount - monthExpensesAmount,
    });
  }

  // Get upcoming payments
  const today = new Date();
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);

  // Only show payments from 7 days ago to 14 days in the future
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Get upcoming recurring expenses
  const recurringExpenses = await prisma.expense.findMany({
    where: {
      userId,
      isRecurring: true,
      date: {
        gte: sevenDaysAgo,
        lte: twoWeeksLater,
      },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      date: true,
    },
    orderBy: {
      date: "asc",
    },
    take: 5,
  });

  // Get upcoming subscriptions (only active ones)
  const upcomingSubscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      isActive: true,
      nextPaymentDate: {
        gte: sevenDaysAgo,
        lte: twoWeeksLater,
      },
    },
    select: {
      id: true,
      name: true,
      amount: true,
      nextPaymentDate: true,
      lastPaymentDate: true,
    },
    orderBy: {
      nextPaymentDate: "asc",
    },
  });

  // Format upcoming payments
  const upcomingPayments = [
    ...recurringExpenses.map((expense) => ({
      id: expense.id,
      name: expense.description,
      amount: Number(expense.amount),
      date: expense.date,
      type: "expense" as const,
    })),
    ...upcomingSubscriptions.map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      amount: Number(subscription.amount),
      date: subscription.nextPaymentDate,
      type: "subscription" as const,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Get expense distribution by category for date range
  const expenseCategories = await prisma.expense.groupBy({
    by: ["category"],
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Get subscription expenses by category
  const subscriptionsByCategory = await prisma.subscription.groupBy({
    by: ["category"],
    where: {
      userId,
      nextPaymentDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Format expense distribution data
  const expenseDistribution = [
    ...expenseCategories.map((category) => ({
      category: category.category,
      value: Number(category._sum.amount || 0),
    })),
    ...subscriptionsByCategory.map((category) => ({
      category: category.category,
      value: Number(category._sum.amount || 0),
    })),
  ];

  // Combine categories and sum values
  const expenseDistributionCombined = expenseDistribution.reduce(
    (acc, item) => {
      const existingCategory = acc.find((c) => c.category === item.category);
      if (existingCategory) {
        existingCategory.value += item.value;
      } else {
        acc.push(item);
      }
      return acc;
    },
    [] as { category: string; value: number }[],
  );

  // Calculate percentage for each category
  const totalExpenseAmount = Number(expenseTotal._sum.amount || 0);
  const expenseDistributionWithPercent = expenseDistributionCombined.map(
    (item) => ({
      ...item,
      percent: totalExpenseAmount > 0 ? item.value / totalExpenseAmount : 0,
    }),
  );

  // Income distribution by category
  const incomeByCategory = await prisma.income.groupBy({
    by: ["category"],
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const incomeDistribution = incomeByCategory.map((item) => ({
    category: item.category,
    value: Number(item._sum.amount || 0),
  }));

  // Recurring vs One-time Analysis
  const recurringAnalysisData = [];
  for (const month of months) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthName = format(month, "MMM yyyy");

    const recurringIncome = await prisma.income.aggregate({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        isRecurring: true,
      },
      _sum: {
        amount: true,
      },
    });

    const oneTimeIncome = await prisma.income.aggregate({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        isRecurring: false,
      },
      _sum: {
        amount: true,
      },
    });

    const recurringExpenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        isRecurring: true,
      },
      _sum: {
        amount: true,
      },
    });

    const oneTimeExpenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        isRecurring: false,
      },
      _sum: {
        amount: true,
      },
    });

    recurringAnalysisData.push({
      month: monthName,
      recurringIncome: Number(recurringIncome._sum.amount || 0),
      oneTimeIncome: Number(oneTimeIncome._sum.amount || 0),
      recurringExpenses: Number(recurringExpenses._sum.amount || 0),
      oneTimeExpenses: Number(oneTimeExpenses._sum.amount || 0),
    });
  }

  // Category Trends (top 5 expense categories)
  const topCategories = await prisma.expense.groupBy({
    by: ["category"],
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
    take: 5,
  });

  const categoryList = topCategories.map((cat) => cat.category);
  const categoryTrendData: Array<{
    month: string;
    [key: string]: string | number;
  }> = [];

  for (const month of months) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthName = format(month, "MMM yyyy");

    const monthData: { month: string; [key: string]: string | number } = {
      month: monthName,
    };

    for (const category of categoryList) {
      const categoryExpenses = await prisma.expense.aggregate({
        where: {
          userId,
          category,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });

      monthData[category] = Number(categoryExpenses._sum.amount || 0);
    }

    categoryTrendData.push(monthData);
  }

  // Subscription Analytics
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      isActive: true,
    },
  });

  let totalMonthlySubscriptions = 0;
  let totalYearlySubscriptions = 0;

  activeSubscriptions.forEach((sub) => {
    if (sub.billingCycle === "MONTHLY") {
      totalMonthlySubscriptions += Number(sub.amount);
    } else if (sub.billingCycle === "YEARLY") {
      totalYearlySubscriptions += Number(sub.amount);
    }
  });

  const thirtyDaysFromToday = new Date(today);
  thirtyDaysFromToday.setDate(today.getDate() + 30);

  const upcomingSubscriptionRenewals = await prisma.subscription.findMany({
    where: {
      userId,
      isActive: true,
      nextPaymentDate: {
        gte: today,
        lte: thirtyDaysFromToday,
      },
    },
    orderBy: {
      nextPaymentDate: "asc",
    },
    select: {
      name: true,
      amount: true,
      nextPaymentDate: true,
    },
  });

  const activeSubscriptionsByCategory = await prisma.subscription.groupBy({
    by: ["category"],
    where: {
      userId,
      isActive: true,
    },
    _sum: {
      amount: true,
    },
  });

  const subscriptionCategoryBreakdown = activeSubscriptionsByCategory.map(
    (cat) => ({
      category: cat.category,
      amount: Number(cat._sum.amount || 0),
    }),
  );

  const subscriptionData = {
    totalMonthly: totalMonthlySubscriptions,
    totalYearly: totalYearlySubscriptions,
    activeCount: activeSubscriptions.length,
    upcomingRenewals: upcomingSubscriptionRenewals.map((renewal) => ({
      name: renewal.name,
      amount: Number(renewal.amount),
      date: renewal.nextPaymentDate,
    })),
    categoryBreakdown: subscriptionCategoryBreakdown,
  };

  // Prepare cash flow data
  const incomeCashFlow = incomeByCategory.map((item) => ({
    category: item.category,
    amount: Number(item._sum.amount || 0),
    type: "income" as const,
  }));

  const expenseCashFlow = expenseDistributionCombined.map((item) => ({
    category: item.category,
    amount: item.value,
    type: "expense" as const,
  }));

  return {
    dateRange: {
      startDate,
      endDate,
      totalIncome: Number(incomeTotal._sum.amount || 0),
      totalExpenses: Number(expenseTotal._sum.amount || 0),
      netBalance:
        Number(incomeTotal._sum.amount || 0) -
        Number(expenseTotal._sum.amount || 0),
    },
    monthlyData,
    upcomingPayments,
    expenseDistribution: expenseDistributionWithPercent,
    incomeDistribution,
    recurringAnalysis: recurringAnalysisData,
    categoryTrends: {
      categories: categoryList,
      data: categoryTrendData,
    },
    subscriptionAnalytics: subscriptionData,
    cashFlowData: {
      income: incomeCashFlow,
      expenses: expenseCashFlow,
    },
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const params = await searchParams;

  // Default date range: last 3 months
  const defaultFrom = startOfMonth(subMonths(new Date(), 2));
  const defaultTo = endOfMonth(new Date());

  const fromDate = params.from ? new Date(params.from) : defaultFrom;
  const toDate = params.to ? new Date(params.to) : defaultTo;

  const dashboardData = await fetchDashboardData(
    session.user.id,
    fromDate,
    toDate,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>

          <DashboardDateRange />
        </div>
      </div>

      <SummaryStats
        totalIncome={dashboardData.dateRange.totalIncome}
        totalExpenses={dashboardData.dateRange.totalExpenses}
        netBalance={dashboardData.dateRange.netBalance}
        startDate={dashboardData.dateRange.startDate}
        endDate={dashboardData.dateRange.endDate}
      />

      {/* Core Financial Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <IncomeExpenseChart data={dashboardData.monthlyData} />
        <ExpenseDistributionChart data={dashboardData.expenseDistribution} />
        <IncomeDistributionChart data={dashboardData.incomeDistribution} />
      </div>

      {/* Income and Cash Flow Analysis */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <SavingsTrendChart data={dashboardData.monthlyData} />
        <CashFlowWaterfallChart
          startBalance={0}
          incomeByCategory={dashboardData.cashFlowData.income}
          expensesByCategory={dashboardData.cashFlowData.expenses}
        />
      </div>

      {/* Recurring and Category Analysis */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <RecurringAnalysisChart data={dashboardData.recurringAnalysis} />
        <CategoryTrendChart
          data={dashboardData.categoryTrends.data}
          categories={dashboardData.categoryTrends.categories}
        />
        <SubscriptionAnalytics data={dashboardData.subscriptionAnalytics} />
      </div>

      {/* Subscriptions and Upcoming Payments */}
      <div className="grid gap-4 grid-cols-1">
        <UpcomingPayments payments={dashboardData.upcomingPayments} />
      </div>
    </div>
  );
}
