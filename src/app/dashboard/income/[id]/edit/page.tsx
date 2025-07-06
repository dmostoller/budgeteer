import { Metadata } from "next";
import { notFound } from "next/navigation";
import { IncomeForm } from "@/components/forms/income-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Edit Income | Budgeteer",
  description: "Edit an income record",
};

export default async function EditIncomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const { id } = await params;

  const income = await prisma.income.findUnique({
    where: {
      id: id,
      userId: session.user.id,
    },
  });

  if (!income) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Income</h1>
        <p className="text-muted-foreground">Edit an existing income record</p>
      </div>
      <IncomeForm
        defaultValues={{
          source: income.source,
          amount: Number(income.amount),
          date: income.date,
          category: income.category,
          isRecurring: income.isRecurring,
          recurrencePeriod: income.recurrencePeriod || undefined,
        }}
        incomeId={income.id}
      />
    </div>
  );
}
