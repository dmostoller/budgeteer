import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { IncomeContent } from "./income-content";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const incomes = await prisma.income
    .findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
    })
    .then((incomes) =>
      incomes.map((income) => ({
        ...income,
        amount: Number(income.amount),
      })),
    );

  return <IncomeContent incomes={incomes} />;
}
