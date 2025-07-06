import { Metadata } from "next";
import { SubscriptionForm } from "@/components/forms/subscription-form";

export const metadata: Metadata = {
  title: "Add Subscription | Budgeteer",
  description: "Add a new subscription",
};

export default function NewSubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Subscription</h1>
        <p className="text-muted-foreground">
          Add a new subscription to your finances
        </p>
      </div>
      <SubscriptionForm />
    </div>
  );
}
