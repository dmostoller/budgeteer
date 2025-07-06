import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { IncomeCategory, RecurrencePeriod } from "@prisma/client";

const bulkIncomeSchema = z.object({
  incomes: z.array(
    z.object({
      amount: z.number().positive(),
      source: z.string(),
      date: z.string(),
      category: z.nativeEnum(IncomeCategory),
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
    const { incomes } = bulkIncomeSchema.parse(body);

    const userId = session.user.id;

    // Create all incomes in a transaction
    const createdIncomes = await db.$transaction(
      incomes.map((income) =>
        db.income.create({
          data: {
            userId,
            amount: income.amount,
            source: income.source,
            date: new Date(income.date),
            category: income.category,
            isRecurring: income.isRecurring || false,
            recurrencePeriod: income.isRecurring
              ? income.recurrencePeriod
              : null,
          },
        }),
      ),
    );

    return new Response(
      JSON.stringify({
        message: `Successfully created ${createdIncomes.length} income entries`,
        incomes: createdIncomes,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("[BULK-INCOMES-ERROR]", error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
