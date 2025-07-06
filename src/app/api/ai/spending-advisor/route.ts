import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req: Request) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();
    const userId = session.user.id;

    // Fetch user financial data
    const [expenses, incomes, subscriptions] = await Promise.all([
      db.expense.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 100,
      }),
      db.income.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 50,
      }),
      db.subscription.findMany({
        where: { userId },
      }),
    ]);

    // Create financial snapshot for analysis
    const financialData = {
      expenses: expenses.map((e) => ({
        amount: Number(e.amount),
        category: e.category,
        date: e.date.toISOString().split("T")[0],
        description: e.description,
        isRecurring: e.isRecurring,
        recurrencePeriod: e.recurrencePeriod,
      })),
      incomes: incomes.map((i) => ({
        amount: Number(i.amount),
        category: i.category,
        date: i.date.toISOString().split("T")[0],
        source: i.source,
        isRecurring: i.isRecurring,
        recurrencePeriod: i.recurrencePeriod,
      })),
      subscriptions: subscriptions.map((s) => ({
        name: s.name,
        amount: Number(s.amount),
        billingCycle: s.billingCycle,
        nextPaymentDate: s.nextPaymentDate.toISOString().split("T")[0],
        category: s.category,
      })),
    };

    // Calculate some basic stats
    const totalMonthlyExpenses = expenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        const currentDate = new Date();
        return (
          expenseDate.getMonth() === currentDate.getMonth() &&
          expenseDate.getFullYear() === currentDate.getFullYear()
        );
      })
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    const totalMonthlySubscriptions = subscriptions
      .filter((s) => s.billingCycle === "MONTHLY")
      .reduce((sum, sub) => sum + Number(sub.amount), 0);

    const monthlySubscriptionsFromYearly = subscriptions
      .filter((s) => s.billingCycle === "YEARLY")
      .reduce((sum, sub) => sum + Number(sub.amount) / 12, 0);

    const totalMonthlyIncome = incomes
      .filter((i) => {
        const incomeDate = new Date(i.date);
        const currentDate = new Date();
        return (
          incomeDate.getMonth() === currentDate.getMonth() &&
          incomeDate.getFullYear() === currentDate.getFullYear()
        );
      })
      .reduce((sum, income) => sum + Number(income.amount), 0);

    // Build the system context
    const systemContext = `
You are an AI financial advisor that analyzes spending patterns and offers personalized advice to save money. 
Be specific, actionable, and supportive, not judgmental.

USER'S FINANCIAL SUMMARY:
- Monthly expenses: $${totalMonthlyExpenses.toFixed(2)}
- Monthly subscriptions: $${totalMonthlySubscriptions.toFixed(2)} + $${monthlySubscriptionsFromYearly.toFixed(2)} (from yearly subscriptions)
- Monthly income: $${totalMonthlyIncome.toFixed(2)}

DETAILED FINANCIAL DATA:
${JSON.stringify(financialData, null, 2)}

Now provide a helpful response that:
1. Analyzes their current spending patterns
2. Identifies potential savings opportunities
3. Suggests specific, actionable steps to reduce expenses
4. Prioritizes the highest-impact changes first
5. Maintains a supportive, encouraging tone
`;

    // Stream the response
    const result = await streamText({
      model: google("gemini-1.5-flash"),
      messages: [
        {
          role: "system",
          content: systemContext,
        },
        ...messages,
      ],
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[AI-SPENDING-ADVISOR-ERROR]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
