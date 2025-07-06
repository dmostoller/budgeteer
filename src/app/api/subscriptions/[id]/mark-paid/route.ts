import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { addMonths, addYears } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: subscriptionId } = await params;

    // Verify ownership and get subscription details
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
        userId: session.user.id,
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
    console.error("Error marking subscription as paid:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 },
    );
  }
}
