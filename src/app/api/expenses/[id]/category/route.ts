import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { requireOwnership, handleAuthError } from "@/lib/auth-helpers";

const categorySchema = z.object({
  category: z.enum([
    "HOUSING",
    "FOOD",
    "TRANSPORTATION",
    "UTILITIES",
    "ENTERTAINMENT",
    "SUBSCRIPTIONS",
    "HEALTHCARE",
    "PERSONAL_CARE",
    "DEBT_PAYMENT",
    "OTHER",
  ]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: expenseId } = await params;
    await requireOwnership("expense", expenseId);

    const body = await req.json();
    const validatedData = categorySchema.parse(body);

    // Update only the category
    const updatedExpense = await prisma.expense.update({
      where: {
        id: expenseId,
      },
      data: {
        category: validatedData.category,
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating expense category:", error);
    return handleAuthError(error);
  }
}
