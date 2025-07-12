import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { requireOwnership, handleAuthError } from "@/lib/auth-helpers";

const recurringSchema = z.object({
  isRecurring: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: expenseId } = await params;
    await requireOwnership("expense", expenseId);

    const body = await req.json();
    const { isRecurring } = recurringSchema.parse(body);

    // Get the existing expense to preserve recurrencePeriod if needed
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
      },
    });

    // Update the expense record
    const updatedExpense = await prisma.expense.update({
      where: {
        id: expenseId,
      },
      data: {
        isRecurring,
        // Clear recurrence period if not recurring
        recurrencePeriod: isRecurring
          ? existingExpense?.recurrencePeriod
          : null,
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating expense recurring status:", error);
    return handleAuthError(error);
  }
}
