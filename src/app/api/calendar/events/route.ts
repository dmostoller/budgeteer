import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

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

    // Fetch data for a 3-month range centered on the target month
    const rangeStart = startOfMonth(subMonths(targetDate, 1));
    const rangeEnd = endOfMonth(addMonths(targetDate, 1));
    const userId = session.user.id;

    // Fetch incomes
    const incomes = await prisma.income.findMany({
      where: {
        userId,
        date: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
    });

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
    });

    // Fetch subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        nextPaymentDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
    });

    // Transform data into calendar events
    const events = [
      ...incomes.map((income) => ({
        id: `income-${income.id}`,
        title: income.source,
        start: income.date,
        end: income.date,
        type: "income" as const,
        category: income.category,
        amount: Number(income.amount),
      })),
      ...expenses.map((expense) => ({
        id: `expense-${expense.id}`,
        title: expense.description,
        start: expense.date,
        end: expense.date,
        type: "expense" as const,
        category: expense.category,
        amount: Number(expense.amount),
      })),
      ...subscriptions.map((subscription) => ({
        id: `subscription-${subscription.id}`,
        title: subscription.name,
        start: subscription.nextPaymentDate,
        end: subscription.nextPaymentDate,
        type: "subscription" as const,
        category: subscription.category,
        amount: Number(subscription.amount),
      })),
    ];

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 },
    );
  }
}
