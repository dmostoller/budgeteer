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

async function fetchCalendarEvents(userId: string, dateParam?: string) {
  // Use the provided date or default to today
  let baseDate = new Date();
  
  // Validate the date parameter
  if (dateParam) {
    // Parse the date string safely
    const parsedDate = new Date(dateParam);
    
    // Check if it's a valid date
    if (!isNaN(parsedDate.getTime())) {
      baseDate = parsedDate;
    }
  }

  // Fetch data for a 3-month range centered on the selected month
  const rangeStart = startOfMonth(subMonths(baseDate, 1));
  const rangeEnd = endOfMonth(addMonths(baseDate, 1));

  // Fetch regular (non-recurring) incomes
  const regularIncomes = await prisma.income.findMany({
    where: {
      userId,
      date: {
        gte: rangeStart,
        lte: rangeEnd,
      },
      isRecurring: false,
    },
  });
  
  // Fetch recurring incomes
  const recurringIncomes = await prisma.income.findMany({
    where: {
      userId,
      isRecurring: true,
    },
  });
  
  // Generate recurring income events based on frequency
  const recurringIncomeEvents = [];
  
  for (const income of recurringIncomes) {
    // The base date is the stored date
    const baseDate = new Date(income.date);
    
    // Generate events based on recurrence period
    if (income.recurrencePeriod === "DAILY") {
      // Generate daily events for the entire range
      const startDate = new Date(rangeStart);
      let currentDate = startDate;
      while (currentDate <= rangeEnd) {
        recurringIncomeEvents.push({
          ...income,
          id: `${income.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (income.recurrencePeriod === "WEEKLY") {
      // Generate weekly events
      let currentDate = new Date(baseDate);
      // Adjust start date to be within range if needed
      while (currentDate < rangeStart) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
        currentDate = nextDate;
      }
      // Generate events within range
      while (currentDate <= rangeEnd) {
        recurringIncomeEvents.push({
          ...income,
          id: `${income.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
        currentDate = nextDate;
      }
    } else if (income.recurrencePeriod === "MONTHLY") {
      // Generate monthly events
      let currentDate = new Date(baseDate);
      // Adjust start date to be within range if needed
      while (currentDate < rangeStart) {
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        currentDate = nextDate;
      }
      // Generate events within range
      while (currentDate <= rangeEnd) {
        recurringIncomeEvents.push({
          ...income,
          id: `${income.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        currentDate = nextDate;
      }
    } else if (income.recurrencePeriod === "QUARTERLY") {
      // Generate quarterly events
      let currentDate = new Date(baseDate);
      // Adjust start date to be within range if needed
      while (currentDate < rangeStart) {
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 3);
        currentDate = nextDate;
      }
      // Generate events within range
      while (currentDate <= rangeEnd) {
        recurringIncomeEvents.push({
          ...income,
          id: `${income.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 3);
        currentDate = nextDate;
      }
    } else if (income.recurrencePeriod === "YEARLY") {
      // Generate yearly events
      let currentDate = new Date(baseDate);
      // Adjust start date to be within range if needed
      while (currentDate < rangeStart) {
        const nextDate = new Date(currentDate);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        currentDate = nextDate;
      }
      // Generate events within range
      while (currentDate <= rangeEnd) {
        recurringIncomeEvents.push({
          ...income,
          id: `${income.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        const nextDate = new Date(currentDate);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        currentDate = nextDate;
      }
    }
  }
  
  // Combine regular and recurring incomes
  const incomes = [...regularIncomes, ...recurringIncomeEvents];

  // Fetch regular (non-recurring) expenses
  const regularExpenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: rangeStart,
        lte: rangeEnd,
      },
      isRecurring: false,
    },
  });
  
  // Fetch recurring expenses
  const recurringExpenses = await prisma.expense.findMany({
    where: {
      userId,
      isRecurring: true,
    },
  });
  
  // Generate recurring expense events based on frequency
  const recurringExpenseEvents = [];
  
  for (const expense of recurringExpenses) {
    // The base date is the stored date
    const baseDate = new Date(expense.date);
    
    // Generate events based on recurrence period
    if (expense.recurrencePeriod === "DAILY") {
      // Generate daily events for the entire range
      const startDate = new Date(rangeStart);
      let currentDate = startDate;
      while (currentDate <= rangeEnd) {
        recurringExpenseEvents.push({
          ...expense,
          id: `${expense.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (expense.recurrencePeriod === "WEEKLY") {
      // Generate weekly events
      let currentDate = new Date(baseDate);
      // Adjust start date to be within range if needed
      while (currentDate < rangeStart) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
        currentDate = nextDate;
      }
      // Generate events within range
      while (currentDate <= rangeEnd) {
        recurringExpenseEvents.push({
          ...expense,
          id: `${expense.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
        currentDate = nextDate;
      }
    } else if (expense.recurrencePeriod === "MONTHLY") {
      // Generate monthly events
      let currentDate = new Date(baseDate);
      // Adjust start date to be within range if needed
      while (currentDate < rangeStart) {
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        currentDate = nextDate;
      }
      // Generate events within range
      while (currentDate <= rangeEnd) {
        recurringExpenseEvents.push({
          ...expense,
          id: `${expense.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        currentDate = nextDate;
      }
    } else if (expense.recurrencePeriod === "QUARTERLY") {
      // Generate quarterly events
      let currentDate = new Date(baseDate);
      // Adjust start date to be within range if needed
      while (currentDate < rangeStart) {
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 3);
        currentDate = nextDate;
      }
      // Generate events within range
      while (currentDate <= rangeEnd) {
        recurringExpenseEvents.push({
          ...expense,
          id: `${expense.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 3);
        currentDate = nextDate;
      }
    } else if (expense.recurrencePeriod === "YEARLY") {
      // Generate yearly events
      let currentDate = new Date(baseDate);
      // Adjust start date to be within range if needed
      while (currentDate < rangeStart) {
        const nextDate = new Date(currentDate);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        currentDate = nextDate;
      }
      // Generate events within range
      while (currentDate <= rangeEnd) {
        recurringExpenseEvents.push({
          ...expense,
          id: `${expense.id}-${currentDate.toISOString()}`,
          date: new Date(currentDate),
        });
        const nextDate = new Date(currentDate);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        currentDate = nextDate;
      }
    }
  }
  
  // Combine regular and recurring expenses
  const expenses = [...regularExpenses, ...recurringExpenseEvents];

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

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const params = await searchParams;
  const events = await fetchCalendarEvents(session.user.id, params.date);

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
