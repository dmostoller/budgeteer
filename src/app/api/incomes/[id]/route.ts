import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnership, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";

const incomeSchema = z.object({
  source: z.string().min(2),
  amount: z.number().positive(),
  date: z.coerce.date(),
  category: z.enum([
    "SALARY",
    "FREELANCE",
    "BONUS",
    "INVESTMENT",
    "GIFT",
    "OTHER",
  ]),
  isRecurring: z.boolean().default(false),
  recurrencePeriod: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"])
    .optional()
    .nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: incomeId } = await params;
    await requireOwnership("income", incomeId);

    const income = await prisma.income.findUnique({
      where: {
        id: incomeId,
      },
    });

    return NextResponse.json(income);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: incomeId } = await params;
    await requireOwnership("income", incomeId);

    const body = await req.json();
    const validatedData = incomeSchema.parse(body);

    // Update the income record
    const updatedIncome = await prisma.income.update({
      where: {
        id: incomeId,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedIncome);
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
    const { id: incomeId } = await params;
    await requireOwnership("income", incomeId);

    // Delete the income record
    await prisma.income.delete({
      where: {
        id: incomeId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
