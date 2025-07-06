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
      model: google("gemini-1.5-flash"),
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
`,
      schema: commandSchema,
      temperature: 0.3,
    });

    const command = intentResponse.object;

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
        model: google("gemini-1.5-flash"),
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
        model: google("gemini-1.5-flash"),
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
    const startDate = command.parameters?.timeframe
      ? getStartDateFromTimeframe(command.parameters.timeframe)
      : startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);

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
      model: google("gemini-1.5-flash"),
      messages: [
        {
          role: "system",
          content: `
You are a helpful financial assistant with access to the user's financial data.
You can answer questions about their finances and help them add transactions.

Current Financial Context:
${JSON.stringify(financialContext, null, 2)}

Recent Transactions:
Expenses: ${JSON.stringify(
            expenses.slice(0, 10).map((e) => ({
              amount: Number(e.amount),
              description: e.description,
              category: e.category,
              date: e.date,
            })),
          )}

When answering:
1. Be specific with numbers and dates
2. Provide actionable insights
3. Use emojis sparingly for clarity
4. Format currency as $X,XXX.XX
5. If asked about a specific transaction, provide details
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

function getStartDateFromTimeframe(timeframe: string): Date {
  const now = new Date();
  const lowerTimeframe = timeframe.toLowerCase();

  if (lowerTimeframe.includes("year")) {
    return new Date(now.getFullYear(), 0, 1);
  } else if (lowerTimeframe.includes("month")) {
    const monthsMatch = lowerTimeframe.match(/(\d+)\s*month/);
    const months = monthsMatch ? parseInt(monthsMatch[1]) : 1;
    return subMonths(now, months - 1);
  } else if (lowerTimeframe.includes("week")) {
    const weeks = parseInt(lowerTimeframe) || 1;
    const date = new Date(now);
    date.setDate(date.getDate() - weeks * 7);
    return date;
  }

  return startOfMonth(now);
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
