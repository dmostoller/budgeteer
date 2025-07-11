import { NextRequest, NextResponse } from "next/server";
import { requireOwnership, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: subscriptionId } = await params;
    await requireOwnership("subscription", subscriptionId);

    // Deactivate the subscription
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    return handleAuthError(error);
  }
}
