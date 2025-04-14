import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // Format: YYYY-MM
    
    let targetDate = new Date();
    if (dateParam) {
      // Parse date from YYYY-MM format
      const [year, month] = dateParam.split("-").map(Number);
      targetDate = new Date(year, month - 1); // month is 0-indexed
    }
    
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const userId = session.user.id;

    // Get regular (non-recurring) income total for current month
    const regularIncomeTotal = await prisma.income.aggregate({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        isRecurring: false,
      },
      _sum: {
        amount: true,
      },
    });
    
    // Get recurring incomes
    const recurringIncomesForMonth = await prisma.income.findMany({
      where: {
        userId,
        isRecurring: true,
      },
    });
    
    // Calculate the total recurring income amount for this month
    const recurringIncomeTotal = recurringIncomesForMonth.reduce((total, income) => {
      // Calculate amount based on recurrence period
      let periodMultiplier = 1;
      
      if (income.recurrencePeriod === "DAILY") {
        // Average days in a month
        periodMultiplier = 30;
      } else if (income.recurrencePeriod === "WEEKLY") {
        // Average weeks in a month
        periodMultiplier = 4.33;
      } else if (income.recurrencePeriod === "QUARTERLY") {
        // 1/3 of a quarter per month
        periodMultiplier = 1/3;
      } else if (income.recurrencePeriod === "YEARLY") {
        // 1/12 of a year per month
        periodMultiplier = 1/12;
      }
      // MONTHLY will use the default multiplier of 1
      
      return total + (Number(income.amount) * periodMultiplier);
    }, 0);
    
    // Total income (regular + recurring)
    const totalIncomeAmount = Number(regularIncomeTotal._sum.amount || 0) + recurringIncomeTotal;

    // Get current month expense total from non-recurring expenses
    const regularExpenseTotal = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        isRecurring: false,
      },
      _sum: {
        amount: true,
      },
    });
    
    // Get recurring expenses for this month - we'll count these separately
    const recurringExpensesForMonth = await prisma.expense.findMany({
      where: {
        userId,
        isRecurring: true,
      },
    });
    
    // Calculate the total recurring expense amount for this month
    const recurringExpenseTotal = recurringExpensesForMonth.reduce((total, expense) => {
      // Calculate amount based on recurrence period
      let periodMultiplier = 1;
      
      if (expense.recurrencePeriod === "DAILY") {
        // Average days in a month
        periodMultiplier = 30;
      } else if (expense.recurrencePeriod === "WEEKLY") {
        // Average weeks in a month
        periodMultiplier = 4.33;
      } else if (expense.recurrencePeriod === "QUARTERLY") {
        // 1/3 of a quarter per month
        periodMultiplier = 1/3;
      } else if (expense.recurrencePeriod === "YEARLY") {
        // 1/12 of a year per month
        periodMultiplier = 1/12;
      }
      // MONTHLY will use the default multiplier of 1
      
      return total + (Number(expense.amount) * periodMultiplier);
    }, 0);
    
    // Get subscription expenses for this month
    const subscriptionTotal = await prisma.subscription.aggregate({
      where: {
        userId,
        OR: [
          // Monthly subscriptions due this month
          {
            billingCycle: "MONTHLY",
            nextPaymentDate: {
              gte: monthStart,
              lte: monthEnd,
            }
          },
          // Yearly subscriptions due this month
          {
            billingCycle: "YEARLY",
            nextPaymentDate: {
              gte: monthStart,
              lte: monthEnd,
            }
          }
        ]
      },
      _sum: {
        amount: true,
      },
    });
    
    // Calculate total expenses (regular + recurring + subscriptions)
    const totalExpenseAmount = 
      Number(regularExpenseTotal._sum.amount || 0) + 
      recurringExpenseTotal + 
      Number(subscriptionTotal._sum.amount || 0);

    // Get monthly data for the chart (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const chartMonth = subMonths(targetDate, i);
      const chartMonthStart = startOfMonth(chartMonth);
      const chartMonthEnd = endOfMonth(chartMonth);
      const monthName = format(chartMonth, "MMM yyyy");

      // Calculate month regular income (non-recurring)
      const monthRegularIncome = await prisma.income.aggregate({
        where: {
          userId,
          date: {
            gte: chartMonthStart,
            lte: chartMonthEnd,
          },
          isRecurring: false,
        },
        _sum: {
          amount: true,
        },
      });
      
      // Get recurring incomes
      const monthRecurringIncomes = await prisma.income.findMany({
        where: {
          userId,
          isRecurring: true,
        },
      });
      
      // Calculate recurring incomes total
      const monthRecurringIncomeTotal = monthRecurringIncomes.reduce((total, income) => {
        // Calculate amount based on recurrence period
        let periodMultiplier = 1;
        
        if (income.recurrencePeriod === "DAILY") {
          // Average days in a month
          periodMultiplier = 30;
        } else if (income.recurrencePeriod === "WEEKLY") {
          // Average weeks in a month
          periodMultiplier = 4.33;
        } else if (income.recurrencePeriod === "QUARTERLY") {
          // 1/3 of a quarter per month
          periodMultiplier = 1/3;
        } else if (income.recurrencePeriod === "YEARLY") {
          // 1/12 of a year per month
          periodMultiplier = 1/12;
        }
        // MONTHLY will use the default multiplier of 1
        
        return total + (Number(income.amount) * periodMultiplier);
      }, 0);
      
      // Total income for the month (regular + recurring)
      const totalMonthIncome = Number(monthRegularIncome._sum.amount || 0) + monthRecurringIncomeTotal;

      // Calculate month regular expenses
      const monthRegularExpenses = await prisma.expense.aggregate({
        where: {
          userId,
          date: {
            gte: chartMonthStart,
            lte: chartMonthEnd,
          },
          isRecurring: false,
        },
        _sum: {
          amount: true,
        },
      });
      
      // Get recurring expenses
      const monthRecurringExpenses = await prisma.expense.findMany({
        where: {
          userId,
          isRecurring: true,
        },
      });
      
      // Calculate recurring expenses total
      const monthRecurringTotal = monthRecurringExpenses.reduce((total, expense) => {
        // Calculate amount based on recurrence period
        let periodMultiplier = 1;
        
        if (expense.recurrencePeriod === "DAILY") {
          // Average days in a month
          periodMultiplier = 30;
        } else if (expense.recurrencePeriod === "WEEKLY") {
          // Average weeks in a month
          periodMultiplier = 4.33;
        } else if (expense.recurrencePeriod === "QUARTERLY") {
          // 1/3 of a quarter per month
          periodMultiplier = 1/3;
        } else if (expense.recurrencePeriod === "YEARLY") {
          // 1/12 of a year per month
          periodMultiplier = 1/12;
        }
        // MONTHLY will use the default multiplier of 1
        
        return total + (Number(expense.amount) * periodMultiplier);
      }, 0);
      
      // Get subscription expenses for this month
      const monthSubscriptionTotal = await prisma.subscription.aggregate({
        where: {
          userId,
          OR: [
            // Monthly subscriptions
            {
              billingCycle: "MONTHLY",
              nextPaymentDate: {
                gte: chartMonthStart,
                lte: chartMonthEnd,
              }
            },
            // Yearly subscriptions
            {
              billingCycle: "YEARLY",
              nextPaymentDate: {
                gte: chartMonthStart,
                lte: chartMonthEnd,
              }
            }
          ]
        },
        _sum: {
          amount: true,
        },
      });
      
      // Total expenses for the month
      const totalMonthExpenses = 
        Number(monthRegularExpenses._sum.amount || 0) + 
        monthRecurringTotal + 
        Number(monthSubscriptionTotal._sum.amount || 0);

      monthlyData.push({
        month: monthName,
        income: totalMonthIncome,
        expenses: totalMonthExpenses,
      });
    }

    // Get upcoming payments
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    // Get upcoming recurring expenses
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        userId,
        isRecurring: true,
      },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
      },
      orderBy: {
        date: "asc",
      },
      take: 5,
    });

    // Get upcoming subscriptions
    const upcomingSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        nextPaymentDate: {
          lte: twoWeeksLater,
        },
      },
      select: {
        id: true,
        name: true,
        amount: true,
        nextPaymentDate: true,
      },
      orderBy: {
        nextPaymentDate: "asc",
      },
    });

    // Format upcoming payments
    const upcomingPayments = [
      ...recurringExpenses.map(expense => ({
        id: expense.id,
        name: expense.description,
        amount: Number(expense.amount),
        date: expense.date,
        type: "expense" as const,
      })),
      ...upcomingSubscriptions.map(subscription => ({
        id: subscription.id,
        name: subscription.name,
        amount: Number(subscription.amount),
        date: subscription.nextPaymentDate,
        type: "subscription" as const,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Response
    return NextResponse.json({
      currentMonth: {
        name: format(targetDate, "MMMM yyyy"),
        totalIncome: totalIncomeAmount,
        totalExpenses: totalExpenseAmount,
        netBalance: totalIncomeAmount - totalExpenseAmount,
      },
      monthlyData,
      upcomingPayments,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
