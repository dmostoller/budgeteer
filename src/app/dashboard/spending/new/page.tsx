import { Metadata } from "next";
import { ExpenseForm } from "@/components/forms/expense-form";

export const metadata: Metadata = {
  title: "Add Expense | Budgeteer",
  description: "Add a new expense record",
};

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Expense</h1>
        <p className="text-muted-foreground">Add a new expense record to your finances</p>
      </div>
      <ExpenseForm />
    </div>
  );
}
