import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

// Helper function to calculate monthly amount based on recurrence period
function calculateMonthlyAmount(amount: number, period: string): number {
  const baseAmount = Number(amount);
  switch (period) {
    case "DAILY":
      return baseAmount * 30;
    case "WEEKLY":
      return baseAmount * 4.33;
    case "QUARTERLY":
      return baseAmount / 3;
    case "YEARLY":
      return baseAmount / 12;
    default:
      return baseAmount; // MONTHLY
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // Format: YYYY-MM

    let targetDate = new Date();
    if (dateParam) {
      // Parse date from YYYY-MM format
      const [year, month] = dateParam.split("-").map(Number);
      targetDate = new Date(year, month - 1); // month is 0-indexed
    }

    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const userId = user.id;

    // Get one-time transactions for current month
    const [regularIncomeTotal, regularExpenseTotal] = await Promise.all([
      prisma.income.aggregate({
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
      }),
      prisma.expense.aggregate({
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
      }),
    ]);

    // Get recurring items that exist as of the target month
    const [recurringIncomes, recurringExpenses, activeSubscriptions] =
      await Promise.all([
        prisma.income.findMany({
          where: {
            userId,
            isRecurring: true,
            date: { lte: monthEnd }, // Only include if created before month end
          },
        }),
        prisma.expense.findMany({
          where: {
            userId,
            isRecurring: true,
            date: { lte: monthEnd }, // Only include if created before month end
          },
        }),
        prisma.subscription.findMany({
          where: {
            userId,
            isActive: true,
          },
        }),
      ]);

    // Calculate recurring income for the current month
    let recurringIncomeTotal = 0;
    recurringIncomes.forEach((income) => {
      recurringIncomeTotal += calculateMonthlyAmount(
        Number(income.amount),
        income.recurrencePeriod || "MONTHLY",
      );
    });

    // Calculate recurring expenses for the current month
    let recurringExpenseTotal = 0;
    recurringExpenses.forEach((expense) => {
      recurringExpenseTotal += calculateMonthlyAmount(
        Number(expense.amount),
        expense.recurrencePeriod || "MONTHLY",
      );
    });

    // Calculate subscription costs for the current month
    let subscriptionMonthlyTotal = 0;
    activeSubscriptions.forEach((sub) => {
      if (sub.billingCycle === "MONTHLY") {
        subscriptionMonthlyTotal += Number(sub.amount);
      } else if (sub.billingCycle === "YEARLY") {
        subscriptionMonthlyTotal += Number(sub.amount) / 12;
      }
    });

    // Calculate totals
    const totalIncomeAmount =
      Number(regularIncomeTotal._sum.amount || 0) + recurringIncomeTotal;
    const totalExpenseAmount =
      Number(regularExpenseTotal._sum.amount || 0) +
      recurringExpenseTotal +
      subscriptionMonthlyTotal;

    // Get monthly data for the chart (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const chartMonth = subMonths(targetDate, i);
      const chartMonthStart = startOfMonth(chartMonth);
      const chartMonthEnd = endOfMonth(chartMonth);
      const monthName = format(chartMonth, "MMM yyyy");

      // Get one-time transactions for this month
      const [monthRegularIncome, monthRegularExpenses] = await Promise.all([
        prisma.income.aggregate({
          where: {
            userId,
            date: {
              gte: chartMonthStart,
              lte: chartMonthEnd,
            },
            isRecurring: false,
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.expense.aggregate({
          where: {
            userId,
            date: {
              gte: chartMonthStart,
              lte: chartMonthEnd,
            },
            isRecurring: false,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      // Calculate recurring amounts for items active in this month
      let monthRecurringIncome = 0;
      recurringIncomes.forEach((income) => {
        if (income.date <= chartMonthEnd) {
          monthRecurringIncome += calculateMonthlyAmount(
            Number(income.amount),
            income.recurrencePeriod || "MONTHLY",
          );
        }
      });

      let monthRecurringExpense = 0;
      recurringExpenses.forEach((expense) => {
        if (expense.date <= chartMonthEnd) {
          monthRecurringExpense += calculateMonthlyAmount(
            Number(expense.amount),
            expense.recurrencePeriod || "MONTHLY",
          );
        }
      });

      // Add subscription costs
      let monthSubscriptionTotal = 0;
      activeSubscriptions.forEach((sub) => {
        if (sub.billingCycle === "MONTHLY") {
          monthSubscriptionTotal += Number(sub.amount);
        } else if (sub.billingCycle === "YEARLY") {
          monthSubscriptionTotal += Number(sub.amount) / 12;
        }
      });

      const totalMonthIncome =
        Number(monthRegularIncome._sum.amount || 0) + monthRecurringIncome;
      const totalMonthExpenses =
        Number(monthRegularExpenses._sum.amount || 0) +
        monthRecurringExpense +
        monthSubscriptionTotal;

      monthlyData.push({
        month: monthName,
        income: totalMonthIncome,
        expenses: totalMonthExpenses,
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
    const recurringExpensesForPayments = await prisma.expense.findMany({
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

    // Get upcoming subscriptions
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
      },
      orderBy: {
        nextPaymentDate: "asc",
      },
    });

    // Format upcoming payments
    const upcomingPayments = [
      ...recurringExpensesForPayments.map((expense) => ({
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

    // Response
    return NextResponse.json({
      currentMonth: {
        name: format(targetDate, "MMMM yyyy"),
        totalIncome: totalIncomeAmount,
        totalExpenses: totalExpenseAmount,
        netBalance: totalIncomeAmount - totalExpenseAmount,
      },
      monthlyData,
      upcomingPayments,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return handleAuthError(error);
  }
}
