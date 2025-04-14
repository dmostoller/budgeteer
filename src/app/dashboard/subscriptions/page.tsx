import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { SubscriptionTable } from "@/components/tables/subscription-table";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const subscriptions = await prisma.subscription
    .findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        nextPaymentDate: "asc",
      },
    })
    .then((subscriptions) =>
      subscriptions.map((sub) => ({
        ...sub,
        amount: Number(sub.amount),
      })),
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <Link href="/dashboard/subscriptions/new" passHref>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Subscription
          </Button>
        </Link>
      </div>
      <SubscriptionTable data={subscriptions} />
    </div>
  );
}
