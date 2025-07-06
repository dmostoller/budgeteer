"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type RecurringAnalysisData = {
  month: string;
  recurringIncome: number;
  oneTimeIncome: number;
  recurringExpenses: number;
  oneTimeExpenses: number;
};

interface RecurringAnalysisChartProps {
  data: RecurringAnalysisData[];
  className?: string;
}

const chartConfig = {
  recurringIncome: {
    label: "Recurring Income",
    color: "var(--chart-1)",
  },
  oneTimeIncome: {
    label: "One-time Income",
    color: "var(--chart-3)",
  },
  recurringExpenses: {
    label: "Recurring Expenses",
    color: "var(--chart-2)",
  },
  oneTimeExpenses: {
    label: "One-time Expenses",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function RecurringAnalysisChart({
  data,
  className,
}: RecurringAnalysisChartProps) {
  // Currency formatter
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Transform data for stacked bars
  const transformedData = data.map((item) => ({
    ...item,
    income: item.recurringIncome + item.oneTimeIncome,
    expenses: item.recurringExpenses + item.oneTimeExpenses,
    recurringIncomePercent:
      item.recurringIncome / (item.recurringIncome + item.oneTimeIncome),
    recurringExpensePercent:
      item.recurringExpenses / (item.recurringExpenses + item.oneTimeExpenses),
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recurring vs One-time Analysis</CardTitle>
        <CardDescription>
          Compare fixed vs variable financial commitments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={transformedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
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
                  formatter={(value, name, item) => {
                    const nameStr = String(name);
                    const isIncome = nameStr.includes("Income");
                    const isRecurring = nameStr.includes("recurring");
                    const percent = isRecurring
                      ? isIncome
                        ? item.payload.recurringIncomePercent
                        : item.payload.recurringExpensePercent
                      : isIncome
                        ? 1 - item.payload.recurringIncomePercent
                        : 1 - item.payload.recurringExpensePercent;

                    return (
                      <div className="flex flex-col">
                        <span className="font-medium text-sm mb-1">
                          {nameStr}
                        </span>
                        <span className="font-medium">
                          {currencyFormatter(value as number)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(percent * 100)}% of total{" "}
                          {isIncome ? "income" : "expenses"}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="recurringIncome"
              stackId="income"
              fill="var(--color-recurringIncome)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="oneTimeIncome"
              stackId="income"
              fill="var(--color-oneTimeIncome)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="recurringExpenses"
              stackId="expenses"
              fill="var(--color-recurringExpenses)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="oneTimeExpenses"
              stackId="expenses"
              fill="var(--color-oneTimeExpenses)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
