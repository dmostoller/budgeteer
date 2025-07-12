import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnership, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";

const subscriptionSchema = z.object({
  name: z.string().min(2),
  amount: z.number().positive(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]),
  nextPaymentDate: z.coerce.date(),
  category: z.enum(["SUBSCRIPTIONS"]).default("SUBSCRIPTIONS"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: subscriptionId } = await params;
    await requireOwnership("subscription", subscriptionId);

    const subscription = await prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: subscriptionId } = await params;
    await requireOwnership("subscription", subscriptionId);

    const body = await req.json();
    const validatedData = subscriptionSchema.parse(body);

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

    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: subscriptionId } = await params;
    await requireOwnership("subscription", subscriptionId);

    // Delete the subscription record
    await prisma.subscription.delete({
      where: {
        id: subscriptionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
