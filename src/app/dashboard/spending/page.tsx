import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { SpendingContent } from "./spending-content";

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

  // Convert Decimal to number for client component
  const serializedExpenses = expenses.map((expense) => ({
    ...expense,
    amount: expense.amount.toNumber(),
  }));

  return <SpendingContent expenses={serializedExpenses} />;
}
