import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { startOfMonth, endOfMonth, format, eachMonthOfInterval } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const userId = session.user.id;

    // 1. Income Distribution by Category
    const incomeByCategory = await prisma.income.groupBy({
      by: ["category"],
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
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

    // 2. Cash Flow Data (starting balance would be previous month's ending balance)
    // For simplicity, we'll use 0 as starting balance
    const totalIncome = await prisma.income.aggregate({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // 3. Recurring vs One-time Analysis
    const months = eachMonthOfInterval({ start, end });
    const recurringAnalysisData = [];

    for (const month of months) {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthName = format(month, "MMM yyyy");

      // Recurring income
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

      // One-time income
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

      // Recurring expenses
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

      // One-time expenses
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

    // 4. Category Trends (top 5 expense categories)
    const topCategories = await prisma.expense.groupBy({
      by: ["category"],
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
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
    const categoryTrendData = [];

    for (const month of months) {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthName = format(month, "MMM yyyy");

      const monthData: { month: string; [key: string]: string | number } = { month: monthName };

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

    // 5. Subscription Analytics
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    // Calculate monthly and yearly totals
    let totalMonthlySubscriptions = 0;
    let totalYearlySubscriptions = 0;

    activeSubscriptions.forEach((sub) => {
      if (sub.billingCycle === "MONTHLY") {
        totalMonthlySubscriptions += Number(sub.amount);
      } else if (sub.billingCycle === "YEARLY") {
        totalYearlySubscriptions += Number(sub.amount);
      }
    });

    // Get upcoming renewals (next 30 days)
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    const upcomingRenewals = await prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
        nextPaymentDate: {
          gte: today,
          lte: thirtyDaysLater,
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

    // Subscription category breakdown
    const subscriptionsByCategory = await prisma.subscription.groupBy({
      by: ["category"],
      where: {
        userId,
        isActive: true,
      },
      _sum: {
        amount: true,
      },
    });

    const subscriptionCategoryBreakdown = subscriptionsByCategory.map((cat) => ({
      category: cat.category,
      amount: Number(cat._sum.amount || 0),
    }));

    const subscriptionData = {
      totalMonthly: totalMonthlySubscriptions,
      totalYearly: totalYearlySubscriptions,
      activeCount: activeSubscriptions.length,
      upcomingRenewals: upcomingRenewals.map((renewal) => ({
        name: renewal.name,
        amount: Number(renewal.amount),
        date: renewal.nextPaymentDate,
      })),
      categoryBreakdown: subscriptionCategoryBreakdown,
    };

    return NextResponse.json({
      incomeDistribution,
      cashFlow: {
        startBalance: 0, // Could be calculated from previous period
        totalIncome: Number(totalIncome._sum.amount || 0),
        totalExpenses: Number(totalExpenses._sum.amount || 0),
      },
      recurringAnalysis: recurringAnalysisData,
      categoryTrends: {
        categories: categoryList,
        data: categoryTrendData,
      },
      subscriptionAnalytics: subscriptionData,
    });
  } catch (error) {
    console.error("Error fetching enhanced dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch enhanced dashboard stats" },
      { status: 500 }
    );
  }
}