import { Metadata } from "next";
import { IncomeForm } from "@/components/forms/income-form";

export const metadata: Metadata = {
  title: "Add Income | Budgeteer",
  description: "Add a new income record",
};

export default function NewIncomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Income</h1>
        <p className="text-muted-foreground">
          Add a new income record to your finances
        </p>
      </div>
      <IncomeForm />
    </div>
  );
}
