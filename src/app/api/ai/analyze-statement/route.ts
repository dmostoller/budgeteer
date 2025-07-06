import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { ExpenseCategory, IncomeCategory } from "@prisma/client";

// Schema for parsed transactions
const transactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  type: z.enum(["income", "expense"]),
  category: z.string(),
  isRecurring: z.boolean(),
  merchantName: z.string().optional(),
});

const analyzedStatementSchema = z.object({
  transactions: z.array(transactionSchema),
  summary: z.object({
    totalIncome: z.number(),
    totalExpenses: z.number(),
    transactionCount: z.number(),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileContent = formData.get("content") as string;

    if (!file && !fileContent) {
      return new Response("No file or content provided", { status: 400 });
    }

    const userId = session.user.id;

    // Get existing transactions to help with duplicate detection
    const existingTransactions = await db.$transaction([
      db.expense.findMany({
        where: { userId },
        select: {
          date: true,
          amount: true,
          description: true,
        },
      }),
      db.income.findMany({
        where: { userId },
        select: {
          date: true,
          amount: true,
          source: true,
        },
      }),
    ]);

    // Create context for the AI
    const systemPrompt = `
You are a financial data extraction expert. Analyze the provided bank statement and extract all transactions.

For each transaction, determine:
1. Date (format: YYYY-MM-DD)
2. Description (clean, readable description)
3. Amount (positive number)
4. Type (income or expense based on context)
5. Category (use these exact values):
   - For expenses: HOUSING, FOOD, TRANSPORTATION, ENTERTAINMENT, UTILITIES, SUBSCRIPTIONS, HEALTHCARE, PERSONAL_CARE, DEBT_PAYMENT, OTHER
   - For income: SALARY, FREELANCE, BONUS, INVESTMENT, GIFT, OTHER
6. isRecurring (true if it appears to be a recurring transaction)
7. merchantName (extract the merchant/company name if possible)

Existing transactions to check for duplicates:
Expenses: ${JSON.stringify(existingTransactions[0].slice(0, 20))}
Income: ${JSON.stringify(existingTransactions[1].slice(0, 20))}

Bank statement content:
${fileContent || "Please extract text from the uploaded file"}

Important:
- Clean up transaction descriptions to be readable
- Detect recurring patterns (subscriptions, regular payments)
- Categorize accurately based on merchant names and descriptions
- Flag potential duplicates based on date/amount matching
`;

    const response = await generateObject({
      model: google("gemini-1.5-flash"),
      prompt: systemPrompt,
      schema: analyzedStatementSchema,
      temperature: 0.3,
    });

    // Map AI categories to our enums
    const mapToExpenseCategory = (category: string): ExpenseCategory => {
      const mapping: Record<string, ExpenseCategory> = {
        HOUSING: ExpenseCategory.HOUSING,
        FOOD: ExpenseCategory.FOOD,
        TRANSPORTATION: ExpenseCategory.TRANSPORTATION,
        ENTERTAINMENT: ExpenseCategory.ENTERTAINMENT,
        SHOPPING: ExpenseCategory.ENTERTAINMENT, // Map shopping to entertainment
        HEALTH: ExpenseCategory.HEALTHCARE,
        HEALTHCARE: ExpenseCategory.HEALTHCARE,
        EDUCATION: ExpenseCategory.OTHER, // Map education to other
        UTILITIES: ExpenseCategory.UTILITIES,
        SUBSCRIPTIONS: ExpenseCategory.SUBSCRIPTIONS,
        PERSONAL_CARE: ExpenseCategory.PERSONAL_CARE,
        DEBT_PAYMENT: ExpenseCategory.DEBT_PAYMENT,
        OTHER: ExpenseCategory.OTHER,
      };
      return mapping[category] || ExpenseCategory.OTHER;
    };

    const mapToIncomeCategory = (category: string): IncomeCategory => {
      const mapping: Record<string, IncomeCategory> = {
        SALARY: IncomeCategory.SALARY,
        FREELANCE: IncomeCategory.FREELANCE,
        INVESTMENT: IncomeCategory.INVESTMENT,
        GIFT: IncomeCategory.GIFT,
        OTHER: IncomeCategory.OTHER,
      };
      return mapping[category] || IncomeCategory.OTHER;
    };

    // Process and check for duplicates
    const processedTransactions = response.object.transactions.map((transaction) => {
      const transactionDate = new Date(transaction.date);
      
      // Check for potential duplicates
      const isDuplicate = transaction.type === "expense"
        ? existingTransactions[0].some(
            (exp) =>
              exp.date.toDateString() === transactionDate.toDateString() &&
              Number(exp.amount) === transaction.amount
          )
        : existingTransactions[1].some(
            (inc) =>
              inc.date.toDateString() === transactionDate.toDateString() &&
              Number(inc.amount) === transaction.amount
          );

      return {
        ...transaction,
        date: transactionDate,
        category: transaction.type === "expense" 
          ? mapToExpenseCategory(transaction.category)
          : mapToIncomeCategory(transaction.category),
        isDuplicate,
        suggestedAction: isDuplicate ? "skip" : "import",
      };
    });

    return new Response(
      JSON.stringify({
        transactions: processedTransactions,
        summary: response.object.summary,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[AI-ANALYZE-STATEMENT-ERROR]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}