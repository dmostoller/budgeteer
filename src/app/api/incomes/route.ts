import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";
import { IncomeCategory } from "@prisma/client";
import { PaginatedResponse } from "@/types/pagination";
import { Income } from "@/types/income";

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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category") as IncomeCategory | null;

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    const whereClause = {
      userId: user.id,
      ...dateFilter,
      ...(category && { category }),
    };

    // Get total count for pagination
    const totalCount = await prisma.income.count({
      where: whereClause,
    });

    // Get paginated data
    const incomes = await prisma.income.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Convert Decimal to number and Date to ISO string for client
    const serializedIncomes = incomes.map((income) => ({
      ...income,
      amount: income.amount.toNumber(),
      date: income.date.toISOString(),
      createdAt: income.createdAt.toISOString(),
      updatedAt: income.updatedAt.toISOString(),
    }));

    const response: PaginatedResponse<Income[]> = {
      data: serializedIncomes as Income[],
      totalCount,
      page,
      limit,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const validatedData = incomeSchema.parse(body);

    // Create the income record
    const income = await prisma.income.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return handleAuthError(error);
  }
}
