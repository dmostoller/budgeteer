"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts";

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

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
  savings?: number;
};

interface SavingsTrendChartProps {
  data: MonthlyData[];
  className?: string;
}

const chartConfig = {
  savings: {
    label: "Savings",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function SavingsTrendChart({ data, className }: SavingsTrendChartProps) {
  // Ensure all data has savings calculated
  const dataWithSavings = data.map((item) => ({
    ...item,
    savings: item.savings ?? item.income - item.expenses,
  }));

  // Currency formatter for Y-axis and tooltip
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Savings Trend</CardTitle>
        <CardDescription>Monthly savings over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={dataWithSavings}
            margin={{
              left: 12,
              right: 12,
              top: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={currencyFormatter}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => currencyFormatter(value as number)}
                />
              }
            />
            <ReferenceLine 
              y={0} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3" 
              opacity={0.5}
            />
            <Line
              dataKey="savings"
              type="natural"
              stroke="var(--color-savings)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-savings)",
                r: 3,
              }}
              activeDot={{
                r: 4,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
