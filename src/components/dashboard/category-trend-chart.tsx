"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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

type CategoryTrendData = {
  month: string;
  [category: string]: string | number;
};

interface CategoryTrendChartProps {
  data: CategoryTrendData[];
  categories: string[];
  className?: string;
}

export function CategoryTrendChart({
  data,
  categories,
  className,
}: CategoryTrendChartProps) {
  // Create dynamic chart config based on categories
  const chartConfig = categories.reduce((acc, category, index) => {
    acc[category] = {
      label: category.replace(/_/g, " "),
      color: `var(--chart-${(index % 5) + 1})`,
    };
    return acc;
  }, {} as ChartConfig);

  // Currency formatter
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
        <CardTitle>Category Spending Trends</CardTitle>
        <CardDescription>
          Track spending patterns across your top categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={data}
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
                  formatter={(value) => currencyFormatter(value as number)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {categories.map((category) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={`var(--color-${category})`}
                strokeWidth={2}
                dot={{
                  fill: `var(--color-${category})`,
                  r: 3,
                }}
                activeDot={{
                  r: 4,
                }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

