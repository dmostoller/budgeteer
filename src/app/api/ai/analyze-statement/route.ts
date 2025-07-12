import { db } from "@/lib/db";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { ExpenseCategory, IncomeCategory } from "@prisma/client";
import {
  splitBankStatementContent,
  mergeBatchResults,
  type BatchResult,
} from "@/lib/bank-statement-utils";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

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
    const user = await requireAuth();

    // Check rate limit
    const rateLimitResponse = await checkAIRateLimit(user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    let fileContent = formData.get("content") as string;
    const fileType = formData.get("fileType") as string;

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    // Extract content based on file type
    if (!fileContent || fileContent === "PDF_FILE_REQUIRES_SERVER_PROCESSING") {
      if (fileType === "pdf" || file.type === "application/pdf") {
        try {
          // Dynamically import pdf-parse to avoid initialization issues
          const pdf = (await import("pdf-parse")).default;

          // Convert File to Buffer for pdf-parse
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const pdfData = await pdf(buffer);
          fileContent = pdfData.text;

          if (!fileContent || fileContent.trim().length === 0) {
            return new Response(
              "Could not extract text from PDF. The file may be image-based or corrupted.",
              { status: 400 },
            );
          }
        } catch (error) {
          console.error("PDF parsing error:", error);
          // Provide a helpful error message
          return new Response(
            "Failed to parse PDF file. Please try uploading a different format (CSV or TXT) or ensure the PDF contains selectable text.",
            { status: 400 },
          );
        }
      } else if (fileType === "image" || file.type.startsWith("image/")) {
        // For images, we'll send them directly to Gemini for OCR
        fileContent = "[IMAGE FILE - Will be processed by AI for OCR]";
      }
    }

    // Validate content
    if (!fileContent || fileContent.trim().length === 0) {
      return new Response("No content could be extracted from the file", {
        status: 400,
      });
    }

    const userId = user.id;

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

    // Check if content needs to be processed in batches
    console.log(`Total content length: ${fileContent.length} characters`);
    const contentChunks = splitBankStatementContent(fileContent, 30); // 30 transactions per batch
    const batchResults: BatchResult[] = [];

    console.log(
      `Processing bank statement in ${contentChunks.length} batch(es)`,
    );
    if (contentChunks.length > 1) {
      console.log(`Content split into batches due to transaction count`);
    }

    // Process each chunk
    for (let i = 0; i < contentChunks.length; i++) {
      const chunk = contentChunks[i];
      const isFirstBatch = i === 0;
      const batchNumber = i + 1;

      console.log(`Processing batch ${batchNumber} of ${contentChunks.length}`);

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

${
  isFirstBatch
    ? `Existing transactions to check for duplicates:
Expenses: ${JSON.stringify(existingTransactions[0].slice(0, 10))}
Income: ${JSON.stringify(existingTransactions[1].slice(0, 10))}`
    : ""
}

Bank statement content (batch ${batchNumber} of ${contentChunks.length}):
${chunk}

Important:
- Extract ALL transactions you can find in this content
- Clean up transaction descriptions to be readable
- Detect recurring patterns (subscriptions, regular payments)
- Categorize accurately based on merchant names and descriptions
- This is batch ${batchNumber} of ${contentChunks.length}, process all transactions in this batch
`;

      try {
        const response = await generateObject({
          model: google("gemini-2.5-flash-lite-preview-06-17"),
          prompt: systemPrompt,
          schema: analyzedStatementSchema,
          temperature: 0.3,
          maxTokens: 8000, // Limit output size per batch
        });

        batchResults.push(response.object);
      } catch (error) {
        console.error(`Error processing batch ${batchNumber}:`, error);
        // Continue with other batches even if one fails
        if (error instanceof Error && error.message.includes("JSON")) {
          throw new Error(
            `Failed to process batch ${batchNumber}. The statement may be too complex. Try uploading a shorter date range.`,
          );
        }
        throw error;
      }
    }

    // Merge all batch results
    const mergedResult = mergeBatchResults(batchResults);
    console.log(
      `Total transactions extracted: ${mergedResult.transactions.length}`,
    );

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
    const processedTransactions = mergedResult.transactions.map(
      (transaction) => {
        const transactionDate = new Date(transaction.date);

        // Check for potential duplicates
        const isDuplicate =
          transaction.type === "expense"
            ? existingTransactions[0].some(
                (exp) =>
                  exp.date.toDateString() === transactionDate.toDateString() &&
                  Number(exp.amount) === transaction.amount,
              )
            : existingTransactions[1].some(
                (inc) =>
                  inc.date.toDateString() === transactionDate.toDateString() &&
                  Number(inc.amount) === transaction.amount,
              );

        return {
          ...transaction,
          date: transactionDate,
          category:
            transaction.type === "expense"
              ? mapToExpenseCategory(transaction.category)
              : mapToIncomeCategory(transaction.category),
          isDuplicate,
          suggestedAction: isDuplicate ? "skip" : "import",
        };
      },
    );

    return new Response(
      JSON.stringify({
        transactions: processedTransactions,
        summary: mergedResult.summary,
        batchesProcessed: contentChunks.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return handleAuthError(error);
    }
    console.error("[AI-ANALYZE-STATEMENT-ERROR]", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("parse") || error.message.includes("PDF")) {
        return new Response(
          "Failed to parse the document. Please ensure it's a valid bank statement.",
          { status: 400 },
        );
      }
      if (error.message.includes("AI") || error.message.includes("generate")) {
        return new Response(
          "AI analysis failed. Please try again or upload a different format.",
          { status: 500 },
        );
      }
    }

    return new Response(
      "Failed to analyze the bank statement. Please try again.",
      { status: 500 },
    );
  }
}
