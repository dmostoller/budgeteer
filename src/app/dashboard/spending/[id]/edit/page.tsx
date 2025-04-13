import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExpenseForm } from "@/components/forms/expense-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Edit Expense | Budgeteer",
  description: "Edit an expense record",
};

export default async function EditExpensePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  const expense = await prisma.expense.findUnique({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });
  
  if (!expense) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Expense</h1>
        <p className="text-muted-foreground">Edit an existing expense record</p>
      </div>
      <ExpenseForm 
        defaultValues={{
          description: expense.description,
          amount: Number(expense.amount),
          date: expense.date,
          category: expense.category,
          isRecurring: expense.isRecurring,
          recurrencePeriod: expense.recurrencePeriod || undefined,
        }} 
        expenseId={expense.id} 
      />
    </div>
  );
}
