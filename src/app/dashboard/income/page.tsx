import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { IncomeTable } from "@/components/tables/income-table";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  const incomes = await prisma.income.findMany({
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
        <h1 className="text-3xl font-bold">Income</h1>
        <Link href="/dashboard/income/new" passHref>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </Link>
      </div>
      <IncomeTable data={incomes} />
    </div>
  );
}
