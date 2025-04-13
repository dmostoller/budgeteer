import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ExpenseTable } from "@/components/tables/expense-table";

export const dynamic = "force-dynamic";

export default async function SpendingPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      date: "desc",
    },
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Spending</h1>
        <Link href="/dashboard/spending/new" passHref>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </Link>
      </div>
      <ExpenseTable data={expenses} />
    </div>
  );
}
