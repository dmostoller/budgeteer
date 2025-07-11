import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";
import { ExpenseCategory } from "@prisma/client";
import { PaginatedResponse } from "@/types/pagination";
import { Expense } from "@/types/expense";

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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category") as ExpenseCategory | null;

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
    const totalCount = await prisma.expense.count({
      where: whereClause,
    });

    // Get paginated data
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
      skip,
      take: limit,
    });

    // Convert Decimal to number and Date to ISO string for client
    const serializedExpenses = expenses.map((expense) => ({
      ...expense,
      amount: expense.amount.toNumber(),
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    const response: PaginatedResponse<Expense[]> = {
      data: serializedExpenses as Expense[],
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
    const validatedData = expenseSchema.parse(body);

    // Create the expense record
    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    // Convert Decimal to number for client
    const serializedExpense = {
      ...expense,
      amount: expense.amount.toNumber(),
    };

    return NextResponse.json(serializedExpense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
