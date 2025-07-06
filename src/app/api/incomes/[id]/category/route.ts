import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: incomeId } = await params;
    const body = await req.json();
    const validatedData = categorySchema.parse(body);

    // Verify ownership
    const existingIncome = await prisma.income.findUnique({
      where: {
        id: incomeId,
        userId: session.user.id,
      },
    });

    if (!existingIncome) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

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

    console.error("Error updating income category:", error);
    return NextResponse.json(
      { error: "Failed to update income category" },
      { status: 500 },
    );
  }
}