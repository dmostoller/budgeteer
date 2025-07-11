import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";

const subscriptionSchema = z.object({
  name: z.string().min(2),
  amount: z.number().positive(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]),
  nextPaymentDate: z.coerce.date(),
  category: z.enum(["SUBSCRIPTIONS"]).default("SUBSCRIPTIONS"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const upcoming = searchParams.get("upcoming");
    const daysAhead = Number(searchParams.get("daysAhead")) || 14; // Default to 14 days

    let dateFilter = {};
    if (upcoming === "true") {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);

      // Only show payments from 7 days ago to daysAhead in the future
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      dateFilter = {
        nextPaymentDate: {
          gte: sevenDaysAgo,
          lte: futureDate,
        },
      };
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        isActive: true, // Only show active subscriptions
        ...dateFilter,
      },
      orderBy: {
        nextPaymentDate: "asc",
      },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const validatedData = subscriptionSchema.parse(body);

    // Create the subscription record
    const subscription = await prisma.subscription.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return handleAuthError(error);
  }
}
