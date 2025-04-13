import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const userId = session.user.id;

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
      const chartMonth = subMonths(targetDate, i);
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

      monthlyData.push({
        month: monthName,
        income: Number(monthIncome._sum.amount || 0),
        expenses: Number(monthExpenses._sum.amount || 0),
      });
    }

    // Get upcoming payments
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    // Get upcoming recurring expenses
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        userId,
        isRecurring: true,
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
      ...recurringExpenses.map(expense => ({
        id: expense.id,
        name: expense.description,
        amount: Number(expense.amount),
        date: expense.date,
        type: "expense" as const,
      })),
      ...upcomingSubscriptions.map(subscription => ({
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
        totalIncome: Number(incomeTotal._sum.amount || 0),
        totalExpenses: Number(expenseTotal._sum.amount || 0),
        netBalance: Number(incomeTotal._sum.amount || 0) - Number(expenseTotal._sum.amount || 0),
      },
      monthlyData,
      upcomingPayments,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
