import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const upcoming = searchParams.get("upcoming");
    const daysAhead = Number(searchParams.get("daysAhead")) || 14; // Default to 14 days

    let dateFilter = {};
    if (upcoming === "true") {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);
      
      dateFilter = {
        nextPaymentDate: {
          lte: futureDate,
        },
      };
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
        ...dateFilter,
      },
      orderBy: {
        nextPaymentDate: "asc",
      },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = subscriptionSchema.parse(body);

    // Create the subscription record
    const subscription = await prisma.subscription.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
