import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { ExpenseCategory, RecurrencePeriod } from "@prisma/client";

const bulkExpenseSchema = z.object({
  expenses: z.array(
    z.object({
      amount: z.number().positive(),
      description: z.string(),
      date: z.string(),
      category: z.nativeEnum(ExpenseCategory),
      isRecurring: z.boolean().optional(),
      recurrencePeriod: z.nativeEnum(RecurrencePeriod).optional(),
    }),
  ),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { expenses } = bulkExpenseSchema.parse(body);

    const userId = session.user.id;

    // Create all expenses in a transaction
    const createdExpenses = await db.$transaction(
      expenses.map((expense) =>
        db.expense.create({
          data: {
            userId,
            amount: expense.amount,
            description: expense.description,
            date: new Date(expense.date),
            category: expense.category,
            isRecurring: expense.isRecurring || false,
            recurrencePeriod: expense.isRecurring
              ? expense.recurrencePeriod
              : null,
          },
        }),
      ),
    );

    return new Response(
      JSON.stringify({
        message: `Successfully created ${createdExpenses.length} expenses`,
        expenses: createdExpenses,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("[BULK-EXPENSES-ERROR]", error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
