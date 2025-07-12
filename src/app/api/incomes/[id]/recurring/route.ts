import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnership, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";

const recurringSchema = z.object({
  isRecurring: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: incomeId } = await params;
    await requireOwnership("income", incomeId);

    const body = await req.json();
    const { isRecurring } = recurringSchema.parse(body);

    // Get the existing income to preserve recurrencePeriod if needed
    const existingIncome = await prisma.income.findUnique({
      where: {
        id: incomeId,
      },
    });

    // Update the income record
    const updatedIncome = await prisma.income.update({
      where: {
        id: incomeId,
      },
      data: {
        isRecurring,
        // Clear recurrence period if not recurring
        recurrencePeriod: isRecurring ? existingIncome?.recurrencePeriod : null,
      },
    });

    return NextResponse.json(updatedIncome);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return handleAuthError(error);
  }
}
