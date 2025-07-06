"use client";

import { Pie, PieChart } from "recharts";

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

type ExpenseDistribution = {
  category: string;
  value: number;
};

interface ExpenseDistributionChartProps {
  data: ExpenseDistribution[];
  className?: string;
}

export function ExpenseDistributionChart({
  data,
  className,
}: ExpenseDistributionChartProps) {
  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Create a ChartConfig object dynamically from the data
  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.category] = {
      label: item.category,
      color: `var(--chart-${(index % 5) + 1})`,
    };
    return acc;
  }, {} as ChartConfig);

  // Add value config for tooltip label
  chartConfig.value = {
    label: "Amount",
  };

  // Prepare chart data with fill colors and percentage
  const chartData = data.map((item, index) => ({
    ...item,
    fill: `var(--chart-${(index % 5) + 1})`,
    percent: item.value / total,
  }));

  return (
    <Card className={className}>
      <CardHeader className="items-center pb-0">
        <CardTitle>Expense Distribution</CardTitle>
        <CardDescription>Breakdown of expenses by category</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => (
                    <div className="flex flex-col">
                      <span className="font-medium text-sm mb-1">{name}</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(value as number)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((item.payload.percent as number) * 100)}% of
                        total
                      </span>
                    </div>
                  )}
                  nameKey="category"
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
