import { Metadata } from "next";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { FinanceCalendar } from "@/components/calendar/finance-calendar";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

export const metadata: Metadata = {
  title: "Financial Calendar | Budgeteer",
  description: "View your financial calendar",
};

export const dynamic = "force-dynamic";

async function fetchCalendarEvents(userId: string) {
  const today = new Date();

  // Fetch data for a 3-month range centered on the current month
  const rangeStart = startOfMonth(subMonths(today, 1));
  const rangeEnd = endOfMonth(addMonths(today, 1));

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

  return events;
}

export default async function CalendarPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const events = await fetchCalendarEvents(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Calendar</h1>
        <p className="text-muted-foreground">
          View your income, expenses, and subscriptions on a calendar
        </p>
      </div>
      <FinanceCalendar events={events} />
    </div>
  );
}
