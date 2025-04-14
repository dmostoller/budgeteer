"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type ExpenseDistribution = {
  category: string;
  value: number;
};

interface ExpenseDistributionChartProps {
  data: ExpenseDistribution[];
  className?: string;
}

// Color palette for the pie chart segments
const COLORS = [
  "hsl(343deg 81% 75%)", // Red
  "hsl(166deg 77% 77%)", // Teal
  "hsl(189deg 70% 80%)", // Blue
  "hsl(249deg 34% 84%)", // Lavender
  "hsl(284deg 24% 82%)", // Purple
  "hsl(23deg 92% 84%)", // Orange
  "hsl(41deg 88% 83%)", // Yellow
  "hsl(115deg 54% 76%)", // Green
  "hsl(214deg 30% 78%)", // Grey Blue
  "hsl(353deg 30% 78%)", // Pink
];

export function ExpenseDistributionChart({
  data,
  className,
}: ExpenseDistributionChartProps) {
  // Currency formatter for tooltip
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
      payload: { percent: number };
    }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-3 shadow-md">
          <p className="font-medium mb-1">{payload[0].name}</p>
          <p style={{ color: payload[0].color }}>
            {currencyFormatter(payload[0].value)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(payload[0].payload.percent * 100)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Expense Distribution</CardTitle>
        <CardDescription>Breakdown of expenses by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                nameKey="category"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
