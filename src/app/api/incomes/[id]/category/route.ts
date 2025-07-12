import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnership, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";

const categorySchema = z.object({
  category: z.enum([
    "SALARY",
    "FREELANCE",
    "BONUS",
    "INVESTMENT",
    "GIFT",
    "OTHER",
  ]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: incomeId } = await params;
    await requireOwnership("income", incomeId);

    const body = await req.json();
    const validatedData = categorySchema.parse(body);

    // Update only the category
    const updatedIncome = await prisma.income.update({
      where: {
        id: incomeId,
      },
      data: {
        category: validatedData.category,
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
