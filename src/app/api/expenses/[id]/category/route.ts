import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: expenseId } = await params;
    const body = await req.json();
    const validatedData = categorySchema.parse(body);

    // Verify ownership
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
        userId: session.user.id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

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
    return NextResponse.json(
      { error: "Failed to update expense category" },
      { status: 500 },
    );
  }
}