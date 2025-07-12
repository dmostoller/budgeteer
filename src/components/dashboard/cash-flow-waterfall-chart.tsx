"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type CashFlowData = {
  name: string;
  value: number;
  total: number;
  type: "start" | "income" | "expense" | "end";
};

type CategoryFlow = {
  category: string;
  amount: number;
  type: "income" | "expense";
};

interface CashFlowWaterfallChartProps {
  startBalance: number;
  incomeByCategory: CategoryFlow[];
  expensesByCategory: CategoryFlow[];
  className?: string;
}

const chartConfig = {
  value: {
    label: "Amount",
  },
  start: {
    label: "Starting Balance",
    color: "var(--chart-4)",
  },
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  expense: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
  end: {
    label: "Ending Balance",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function CashFlowWaterfallChart({
  startBalance,
  incomeByCategory,
  expensesByCategory,
  className,
}: CashFlowWaterfallChartProps) {
  // Build waterfall data with category breakdown
  const data: CashFlowData[] = [];
  let runningTotal = startBalance;

  // Start balance
  data.push({
    name: "Start",
    value: startBalance,
    total: runningTotal,
    type: "start",
  });

  // Add income categories
  incomeByCategory.forEach((income) => {
    runningTotal += income.amount;
    data.push({
      name: income.category.replace(/_/g, " "),
      value: income.amount,
      total: runningTotal,
      type: "income",
    });
  });

  // Add expense categories (top 5 by amount)
  const topExpenses = expensesByCategory
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  topExpenses.forEach((expense) => {
    runningTotal -= expense.amount;
    data.push({
      name: expense.category.replace(/_/g, " "),
      value: -expense.amount,
      total: runningTotal,
      type: "expense",
    });
  });

  // Add "Other Expenses" if there are more than 5 categories
  if (expensesByCategory.length > 5) {
    const otherExpenses = expensesByCategory
      .sort((a, b) => b.amount - a.amount)
      .slice(5)
      .reduce((sum, exp) => sum + exp.amount, 0);

    if (otherExpenses > 0) {
      runningTotal -= otherExpenses;
      data.push({
        name: "Other Expenses",
        value: -otherExpenses,
        total: runningTotal,
        type: "expense",
      });
    }
  }

  // End balance
  data.push({
    name: "End",
    value: runningTotal,
    total: runningTotal,
    type: "end",
  });

  // Currency formatter
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cash Flow Breakdown</CardTitle>
        <CardDescription>
          Detailed flow of income and expenses by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={currencyFormatter}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => (
                    <div className="flex flex-col">
                      <span className="font-medium text-sm mb-1">
                        {item.payload.type === "expense" ? "Expenses" : name}
                      </span>
                      <span className="font-medium">
                        {item.payload.type === "expense" && "-"}
                        {currencyFormatter(value as number)}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Balance: {currencyFormatter(item.payload.total)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`var(--color-${entry.type})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
