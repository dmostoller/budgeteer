import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubscriptionForm } from "@/components/forms/subscription-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Edit Subscription | Budgeteer",
  description: "Edit a subscription",
};

export default async function EditSubscriptionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  const subscription = await prisma.subscription.findUnique({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });
  
  if (!subscription) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Subscription</h1>
        <p className="text-muted-foreground">Edit an existing subscription</p>
      </div>
      <SubscriptionForm 
        defaultValues={{
          name: subscription.name,
          amount: Number(subscription.amount),
          billingCycle: subscription.billingCycle,
          nextPaymentDate: subscription.nextPaymentDate,
        }} 
        subscriptionId={subscription.id} 
      />
    </div>
  );
}
