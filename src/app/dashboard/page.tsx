import { SummaryStats } from "@/components/dashboard/summary-stats";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { ExpenseDistributionChart } from "@/components/dashboard/expense-distribution-chart";
import { SavingsTrendChart } from "@/components/dashboard/savings-trend-chart";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const dynamic = "force-dynamic";

async function fetchDashboardData(userId: string) {
  // Get current month data
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthStart = startOfMonth(new Date(currentYear, currentMonth));
  const monthEnd = endOfMonth(new Date(currentYear, currentMonth));

  // Get current month income total
  const incomeTotal = await prisma.income.aggregate({
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

  // Get current month expense total
  const expenseTotal = await prisma.expense.aggregate({
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

  // Get monthly data for the chart (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const chartMonth = subMonths(today, i);
    const chartMonthStart = startOfMonth(chartMonth);
    const chartMonthEnd = endOfMonth(chartMonth);
    const monthName = format(chartMonth, "MMM yyyy");

    // Calculate month income
    const monthIncome = await prisma.income.aggregate({
      where: {
        userId,
        date: {
          gte: chartMonthStart,
          lte: chartMonthEnd,
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
          gte: chartMonthStart,
          lte: chartMonthEnd,
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
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);

  // Get upcoming recurring expenses
  const recurringExpenses = await prisma.expense.findMany({
    where: {
      userId,
      isRecurring: true,
      date: {
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

  // Get upcoming subscriptions
  const upcomingSubscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      nextPaymentDate: {
        lte: twoWeeksLater,
      },
    },
    select: {
      id: true,
      name: true,
      amount: true,
      nextPaymentDate: true,
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

  // Get expense distribution by category for current month
  const expenseCategories = await prisma.expense.groupBy({
    by: ["category"],
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

  // Get subscription expenses by category
  const subscriptionsByCategory = await prisma.subscription.groupBy({
    by: ["category"],
    where: {
      userId,
      nextPaymentDate: {
        gte: monthStart,
        lte: monthEnd,
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

  return {
    currentMonth: {
      name: format(today, "MMMM yyyy"),
      totalIncome: Number(incomeTotal._sum.amount || 0),
      totalExpenses: Number(expenseTotal._sum.amount || 0),
      netBalance:
        Number(incomeTotal._sum.amount || 0) -
        Number(expenseTotal._sum.amount || 0),
    },
    monthlyData,
    upcomingPayments,
    expenseDistribution: expenseDistributionWithPercent,
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const dashboardData = await fetchDashboardData(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Link href="/dashboard/income/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Income
            </Button>
          </Link>
          <Link href="/dashboard/spending/new">
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      <SummaryStats
        totalIncome={dashboardData.currentMonth.totalIncome}
        totalExpenses={dashboardData.currentMonth.totalExpenses}
        netBalance={dashboardData.currentMonth.netBalance}
        monthName={dashboardData.currentMonth.name}
      />

      {/* First row of charts - Income/Expense Bar Chart and Upcoming Payments */}

      {/* Second row of charts - Expense Distribution and Savings Trend */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="col-span-full">
          <IncomeExpenseChart data={dashboardData.monthlyData} />
        </div>
        <ExpenseDistributionChart data={dashboardData.expenseDistribution} />
        <SavingsTrendChart data={dashboardData.monthlyData} />
      </div>
      <UpcomingPayments payments={dashboardData.upcomingPayments} />
    </div>
  );
}
