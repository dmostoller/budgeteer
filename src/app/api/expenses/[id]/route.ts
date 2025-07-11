import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnership, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";

const expenseSchema = z.object({
  description: z.string().min(2),
  amount: z.number().positive(),
  date: z.coerce.date(),
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
  isRecurring: z.boolean().default(false),
  recurrencePeriod: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"])
    .optional()
    .nullable(),
});

const patchExpenseSchema = expenseSchema.partial();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: expenseId } = await params;
    const user = await requireOwnership("expense", expenseId);

    const expense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
        userId: user.id,
      },
    });

    if (!expense) {
      throw new Error("Resource not found");
    }

    // Convert Decimal to number for client
    const serializedExpense = {
      ...expense,
      amount: expense.amount.toNumber(),
    };

    return NextResponse.json(serializedExpense);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: expenseId } = await params;
    await requireOwnership("expense", expenseId);

    const body = await req.json();
    const validatedData = patchExpenseSchema.parse(body);

    // Update the expense record
    const updatedExpense = await prisma.expense.update({
      where: {
        id: expenseId,
      },
      data: validatedData,
    });

    // Convert Decimal to number for client
    const serializedExpense = {
      ...updatedExpense,
      amount: updatedExpense.amount.toNumber(),
    };

    return NextResponse.json(serializedExpense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: expenseId } = await params;
    await requireOwnership("expense", expenseId);

    // Delete the expense record
    await prisma.expense.delete({
      where: {
        id: expenseId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
