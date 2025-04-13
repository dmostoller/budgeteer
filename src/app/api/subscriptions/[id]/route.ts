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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionId = params.id;

    const subscription = await prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionId = params.id;
    const body = await req.json();
    const validatedData = subscriptionSchema.parse(body);

    // Verify ownership
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Update the subscription record
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscriptionId,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionId = params.id;

    // Verify ownership
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Delete the subscription record
    await prisma.subscription.delete({
      where: {
        id: subscriptionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
