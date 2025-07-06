import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { google } from "@ai-sdk/google";
import { streamText, generateObject } from "ai";
import { z } from "zod";
import {
  ExpenseCategory,
  IncomeCategory,
  RecurrencePeriod,
} from "@prisma/client";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

// Schema for command detection
const commandSchema = z.object({
  type: z.enum([
    "query",
    "add_expense",
    "add_income",
    "update",
    "delete",
    "analysis",
  ]),
  parameters: z
    .object({
      // For queries
      timeframe: z.string().optional(),
      category: z.string().optional(),

      // For adding transactions
      amount: z.number().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      transactionCategory: z.string().optional(),
      isRecurring: z.boolean().optional(),
      recurrencePeriod: z.string().optional(),

      // For updates/deletes
      transactionId: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();
    const userId = session.user.id;
    const lastMessage = messages[messages.length - 1].content;

    // First, detect the intent
    const intentResponse = await generateObject({
      model: google("gemini-2.5-flash-lite-preview-06-17"),
      prompt: `
Analyze this user message and determine the intent:
"${lastMessage}"

Possible intents:
- query: User is asking about their finances (e.g., "how much did I spend on food?")
- add_expense: User wants to add an expense (e.g., "add $50 groceries")
- add_income: User wants to add income (e.g., "I got paid $2000")
- update: User wants to update a transaction
- delete: User wants to delete a transaction
- analysis: User wants financial analysis or advice

Extract relevant parameters like amounts, dates, categories, etc.

For timeframe detection, look for:
- Specific months: "in May", "last month", "in January", "previous month"
- Relative time: "last 3 months", "past week", "30 days ago"
- Year references: "this year", "last year", "in 2024"

IMPORTANT timeframe extraction rules:
- "in May" or just "May" → set timeframe to "may"
- "last May" → set timeframe to "last may"
- "May 2024" → set timeframe to "may 2024"
- "last month" → set timeframe to "last month"
- "how much did I spend on food" (no time specified) → leave timeframe empty for default
- Always extract the timeframe exactly as mentioned by the user
`,
      schema: commandSchema,
      temperature: 0.3,
    });

    const command = intentResponse.object;
    
    // Debug logging
    console.log("[AI-CHAT] Intent detected:", command);
    console.log("[AI-CHAT] Timeframe extracted:", command.parameters?.timeframe);

    // Handle different command types
    if (command.type === "add_expense" && command.parameters?.amount) {
      const expense = await db.expense.create({
        data: {
          userId,
          amount: command.parameters.amount,
          description: command.parameters.description || "AI-added expense",
          date: command.parameters.date
            ? new Date(command.parameters.date)
            : new Date(),
          category: mapToExpenseCategory(
            command.parameters.transactionCategory || "OTHER",
          ),
          isRecurring: command.parameters.isRecurring || false,
          recurrencePeriod: command.parameters.recurrencePeriod
            ? mapToRecurrencePeriod(command.parameters.recurrencePeriod)
            : null,
        },
      });

      // Stream the success message instead of returning JSON
      const result = await streamText({
        model: google("gemini-2.5-flash-lite-preview-06-17"),
        messages: [
          ...messages,
          {
            role: "assistant",
            content: `✅ Successfully added expense: $${expense.amount} for ${expense.description}`,
          },
        ],
        temperature: 0.7,
      });

      return result.toDataStreamResponse();
    }

    if (command.type === "add_income" && command.parameters?.amount) {
      const income = await db.income.create({
        data: {
          userId,
          amount: command.parameters.amount,
          source: command.parameters.description || "AI-added income",
          date: command.parameters.date
            ? new Date(command.parameters.date)
            : new Date(),
          category: mapToIncomeCategory(
            command.parameters.transactionCategory || "OTHER",
          ),
          isRecurring: command.parameters.isRecurring || false,
          recurrencePeriod: command.parameters.recurrencePeriod
            ? mapToRecurrencePeriod(command.parameters.recurrencePeriod)
            : null,
        },
      });

      // Stream the success message instead of returning JSON
      const result = await streamText({
        model: google("gemini-2.5-flash-lite-preview-06-17"),
        messages: [
          ...messages,
          {
            role: "assistant",
            content: `✅ Successfully added income: $${income.amount} from ${income.source}`,
          },
        ],
        temperature: 0.7,
      });

      return result.toDataStreamResponse();
    }

    // For queries and analysis, fetch relevant data
    const currentDate = new Date();
    // If there's a timeframe, use it. Otherwise, default to last 3 months
    const dateRange = command.parameters?.timeframe
      ? getDateRangeFromTimeframe(command.parameters.timeframe)
      : {
          start: startOfMonth(subMonths(currentDate, 2)),
          end: endOfMonth(currentDate),
        };
    const startDate = dateRange.start;
    const endDate = dateRange.end;
    
    console.log("[AI-CHAT] Date range:", { 
      start: startDate.toISOString(), 
      end: endDate.toISOString() 
    });

    const [expenses, incomes, subscriptions] = await Promise.all([
      db.expense.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          ...(command.parameters?.category && {
            category: mapToExpenseCategory(command.parameters.category),
          }),
        },
        orderBy: { date: "desc" },
      }),
      db.income.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "desc" },
      }),
      db.subscription.findMany({
        where: { userId },
      }),
    ]);

    // Create financial context
    const financialContext = {
      timeframe: `${startDate.toDateString()} to ${endDate.toDateString()}`,
      totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      totalIncome: incomes.reduce((sum, i) => sum + Number(i.amount), 0),
      expensesByCategory: groupByCategory(expenses),
      subscriptionsCost: subscriptions.reduce(
        (sum, s) => sum + Number(s.amount),
        0,
      ),
      transactionCount: expenses.length + incomes.length,
    };

    // Stream the response
    const result = await streamText({
      model: google("gemini-2.5-flash-lite-preview-06-17"),
      messages: [
        {
          role: "system",
          content: `
You are a helpful financial assistant with access to the user's financial data.
You can answer questions about their finances and help them add transactions.

IMPORTANT: You have access to data from ${financialContext.timeframe}. This is the data range I'm currently showing you.

If there are no transactions in this timeframe, let the user know there's no data for that period.
If the user asks about data outside this range, let them know they can specify a different timeframe (e.g., "show me expenses from last year" or "what did I spend in January").

Current Financial Context:
${JSON.stringify(financialContext, null, 2)}

Recent Transactions (up to 10):
Expenses: ${JSON.stringify(
            expenses.slice(0, 10).map((e) => ({
              amount: Number(e.amount),
              description: e.description,
              category: e.category,
              date: e.date,
            })),
          )}

Income: ${JSON.stringify(
            incomes.slice(0, 5).map((i) => ({
              amount: Number(i.amount),
              source: i.source,
              category: i.category,
              date: i.date,
            })),
          )}

Active Subscriptions: ${JSON.stringify(
            subscriptions.slice(0, 5).map((s) => ({
              name: s.name,
              amount: Number(s.amount),
              billingCycle: s.billingCycle,
            })),
          )}

When answering:
1. Be specific with numbers and dates
2. Always mention the timeframe you're looking at
3. Provide actionable insights
4. Use emojis sparingly for clarity
5. Format currency as $X,XXX.XX
6. If asked about a specific transaction, provide details
7. If the user seems to be asking about data outside the current range, suggest they specify a timeframe
`,
        },
        ...messages,
      ],
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[AI-CHAT-ERROR]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Helper functions
function mapToExpenseCategory(category: string): ExpenseCategory {
  const upperCategory = category.toUpperCase();
  return Object.values(ExpenseCategory).includes(
    upperCategory as ExpenseCategory,
  )
    ? (upperCategory as ExpenseCategory)
    : ExpenseCategory.OTHER;
}

function mapToIncomeCategory(category: string): IncomeCategory {
  const upperCategory = category.toUpperCase();
  return Object.values(IncomeCategory).includes(upperCategory as IncomeCategory)
    ? (upperCategory as IncomeCategory)
    : IncomeCategory.OTHER;
}

function mapToRecurrencePeriod(period: string): RecurrencePeriod {
  const upperPeriod = period.toUpperCase();
  return Object.values(RecurrencePeriod).includes(
    upperPeriod as RecurrencePeriod,
  )
    ? (upperPeriod as RecurrencePeriod)
    : RecurrencePeriod.MONTHLY;
}

function getDateRangeFromTimeframe(timeframe: string): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  const lowerTimeframe = timeframe.toLowerCase();

  // Check for "this year" or "current year"
  if (
    lowerTimeframe.includes("this year") ||
    lowerTimeframe.includes("current year")
  ) {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: endOfMonth(now),
    };
  }

  // Check for "last year" or "previous year"
  if (
    lowerTimeframe.includes("last year") ||
    lowerTimeframe.includes("previous year")
  ) {
    return {
      start: new Date(now.getFullYear() - 1, 0, 1),
      end: new Date(now.getFullYear() - 1, 11, 31),
    };
  }

  // Check for specific month names
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  for (let i = 0; i < monthNames.length; i++) {
    if (lowerTimeframe.includes(monthNames[i])) {
      let year = now.getFullYear();
      
      // Handle different cases:
      // 1. "last may" when we're past May → use last year
      // 2. "may 2024" → extract the year
      // 3. "may" alone → use current year
      
      // Check for explicit year
      const yearMatch = lowerTimeframe.match(/(\d{4})/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
      } 
      // Check for "last" + month when we're past that month
      else if (lowerTimeframe.includes("last")) {
        // Always use previous year when "last" is specified with a month name
        year = now.getFullYear() - 1;
      }
      // Plain month name - use current year
      
      return {
        start: new Date(year, i, 1),
        end: endOfMonth(new Date(year, i, 1)),
      };
    }
  }

  // Check for "last month" or "previous month"
  if (
    lowerTimeframe.includes("last month") ||
    lowerTimeframe.includes("previous month")
  ) {
    const lastMonth = subMonths(now, 1);
    return {
      start: startOfMonth(lastMonth),
      end: endOfMonth(lastMonth),
    };
  }

  // Check for "X months ago" or "past X months" or "last X months"
  const monthsAgoMatch = lowerTimeframe.match(/(\d+)\s*months?\s*(ago|back)/);
  const pastMonthsMatch = lowerTimeframe.match(/(past|last)\s*(\d+)\s*months?/);
  const monthsMatch = lowerTimeframe.match(/(\d+)\s*months?/);

  if (monthsAgoMatch) {
    const months = parseInt(monthsAgoMatch[1]);
    const targetMonth = subMonths(now, months);
    return {
      start: startOfMonth(targetMonth),
      end: endOfMonth(targetMonth),
    };
  } else if (pastMonthsMatch) {
    const months = parseInt(pastMonthsMatch[2]);
    return {
      start: startOfMonth(subMonths(now, months - 1)),
      end: endOfMonth(now),
    };
  } else if (monthsMatch && lowerTimeframe.includes("month")) {
    const months = parseInt(monthsMatch[1]);
    return {
      start: startOfMonth(subMonths(now, months - 1)),
      end: endOfMonth(now),
    };
  }

  // Check for weeks
  const weeksMatch = lowerTimeframe.match(/(\d+)\s*weeks?\s*(ago|back)?/);
  const pastWeeksMatch = lowerTimeframe.match(/(past|last)\s*(\d+)\s*weeks?/);

  if (weeksMatch || pastWeeksMatch) {
    const weeks = parseInt(weeksMatch ? weeksMatch[1] : pastWeeksMatch![2]);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - weeks * 7);
    return {
      start: startDate,
      end: now,
    };
  }

  // Check for days
  const daysMatch = lowerTimeframe.match(/(\d+)\s*days?\s*(ago|back)?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    return {
      start: startDate,
      end: now,
    };
  }

  // Default to last 3 months if no specific timeframe is found
  return {
    start: startOfMonth(subMonths(now, 2)),
    end: endOfMonth(now),
  };
}

function groupByCategory(
  expenses: {
    category: string;
    amount: number | string | { toString(): string };
  }[],
): Record<string, number> {
  return expenses.reduce(
    (acc: Record<string, number>, expense) => {
      const category = expense.category;
      acc[category] = (acc[category] || 0) + Number(expense.amount);
      return acc;
    },
    {} as Record<string, number>,
  );
}
