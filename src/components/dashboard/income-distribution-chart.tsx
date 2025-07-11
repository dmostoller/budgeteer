"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

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
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrivacy } from "@/contexts/privacy-context";
import { formatCurrencyWithPrivacy } from "@/lib/utils";

type IncomeDistribution = {
  category: string;
  value: number;
};

interface IncomeDistributionChartProps {
  data: IncomeDistribution[];
  className?: string;
}

export function IncomeDistributionChart({
  data,
  className,
}: IncomeDistributionChartProps) {
  const { isPrivacyMode } = usePrivacy();
  const id = "income-distribution-interactive";

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Sort data by value for better visualization
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // State for active category
  const [activeCategory, setActiveCategory] = React.useState(
    sortedData[0]?.category || "",
  );

  // Create a ChartConfig object dynamically from the data
  const chartConfig = sortedData.reduce((acc, item, index) => {
    acc[item.category] = {
      label: item.category.replace(/_/g, " "),
      color: `var(--chart-${(index % 5) + 1})`,
    };
    return acc;
  }, {} as ChartConfig);

  // Add value config for tooltip label
  chartConfig.value = {
    label: "Amount",
  };

  // Prepare chart data with fill colors and percentage
  const chartData = sortedData.map((item, index) => ({
    ...item,
    fill: `var(--chart-${(index % 5) + 1})`,
    percent: item.value / total,
  }));

  // Find active index
  const activeIndex = React.useMemo(
    () => chartData.findIndex((item) => item.category === activeCategory),
    [activeCategory, chartData],
  );

  // Get active item data
  const activeItem = chartData[activeIndex];

  // Custom formatter for center label with compact notation
  const formatCenterLabel = (value: number) => {
    if (isPrivacyMode) {
      // Create compact format then replace digits with dots
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: "compact",
      }).format(value);
      return formatted.replace(/\d/g, "•");
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value);
  };

  return (
    <Card data-chart={id} className={className}>
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Income Distribution</CardTitle>
          <CardDescription>Breakdown of income by source</CardDescription>
        </div>
        <Select value={activeCategory} onValueChange={setActiveCategory}>
          <SelectTrigger
            className="ml-auto h-7 w-[160px] rounded-lg pl-2.5"
            aria-label="Select income category"
          >
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {sortedData.map((item) => {
              const config =
                chartConfig[item.category as keyof typeof chartConfig];
              if (!config) return null;

              return (
                <SelectItem
                  key={item.category}
                  value={item.category}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor: `var(--color-${item.category})`,
                      }}
                    />
                    {config.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => (
                    <div className="flex flex-col">
                      <span className="font-medium text-sm mb-1">
                        {chartConfig[name as keyof typeof chartConfig]?.label ||
                          name}
                      </span>
                      <span className="font-medium">
                        {formatCurrencyWithPrivacy(
                          value as number,
                          isPrivacyMode,
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((item.payload.percent as number) * 100)}% of
                        total
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
              onClick={(data) => {
                setActiveCategory(data.category);
              }}
              className="cursor-pointer"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {formatCenterLabel(activeItem?.value || 0)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {chartConfig[
                            activeCategory as keyof typeof chartConfig
                          ]?.label || ""}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
