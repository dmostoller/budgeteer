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
import { usePrivacy } from "@/contexts/privacy-context";
import { formatCurrencyWithPrivacy } from "@/lib/utils";

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
};

interface IncomeExpenseChartProps {
  data: MonthlyData[];
  className?: string;
}

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function IncomeExpenseChart({
  data,
  className,
}: IncomeExpenseChartProps) {
  const { isPrivacyMode } = usePrivacy();

  // Currency formatter for Y-axis and tooltip
  const currencyFormatter = (value: number) => {
    return formatCurrencyWithPrivacy(value, isPrivacyMode);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Income vs. Expenses</CardTitle>
        <CardDescription>
          Comparison of monthly income and expenses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
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
                  formatter={(value) => currencyFormatter(value as number)}
                  indicator="dashed"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="income"
              fill="var(--color-income)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              fill="var(--color-expenses)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
