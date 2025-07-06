"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

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

export function SavingsTrendChart({ data, className }: SavingsTrendChartProps) {
  // Ensure all data has savings calculated
  const dataWithSavings = data.map((item) => ({
    ...item,
    savings: item.savings ?? item.income - item.expenses,
  }));

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
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-3 shadow-md">
          <p className="font-medium mb-1">{label}</p>
          <p style={{ color: "hsl(189deg 70% 80%)" }}>
            Savings: {currencyFormatter(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Savings Trend</CardTitle>
        <CardDescription>Monthly savings over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dataWithSavings}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={currencyFormatter} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="hsl(189deg 70% 80%)"
                fill="hsl(189deg 70% 80% / 0.2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
