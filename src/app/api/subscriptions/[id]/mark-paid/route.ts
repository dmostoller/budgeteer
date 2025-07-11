import { NextRequest, NextResponse } from "next/server";
import { requireOwnership, handleAuthError } from "@/lib/auth-helpers";
import prisma from "@/lib/db";
import { addMonths, addYears } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: subscriptionId } = await params;
    await requireOwnership("subscription", subscriptionId);

    // Get subscription details
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

    // Calculate next payment date based on billing cycle
    const currentNextPaymentDate = subscription.nextPaymentDate;
    let newNextPaymentDate: Date;

    if (subscription.billingCycle === "MONTHLY") {
      newNextPaymentDate = addMonths(currentNextPaymentDate, 1);
    } else {
      newNextPaymentDate = addYears(currentNextPaymentDate, 1);
    }

    // Update subscription with new payment dates
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        lastPaymentDate: currentNextPaymentDate,
        nextPaymentDate: newNextPaymentDate,
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    return handleAuthError(error);
  }
}
