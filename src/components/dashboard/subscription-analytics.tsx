"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { CreditCard, Calendar, TrendingUp, AlertCircle } from "lucide-react";

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

type SubscriptionData = {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  upcomingRenewals: Array<{
    name: string;
    amount: number;
    date: Date | string;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
  }>;
};

interface SubscriptionAnalyticsProps {
  data: SubscriptionData;
  className?: string;
}

const chartConfig = {
  amount: {
    label: "Amount",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SubscriptionAnalytics({
  data,
  className,
}: SubscriptionAnalyticsProps) {
  // Currency formatter
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate annual cost
  const annualCost = data.totalMonthly * 12 + data.totalYearly;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Subscription Analytics</CardTitle>
        <CardDescription>
          Overview of your recurring subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Monthly Cost</span>
            </div>
            <p className="text-2xl font-bold">
              {currencyFormatter(data.totalMonthly)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Annual Cost</span>
            </div>
            <p className="text-2xl font-bold">
              {currencyFormatter(annualCost)}
            </p>
          </div>
        </div>

        {/* Active Subscriptions Count */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Active Subscriptions</span>
          </div>
          <span className="text-2xl font-bold">{data.activeCount}</span>
        </div>

        {/* Category Breakdown Mini Chart */}
        {data.categoryBreakdown.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">By Category</h4>
            <ChartContainer config={chartConfig} className="h-[150px] w-full">
              <BarChart
                data={data.categoryBreakdown}
                layout="horizontal"
                margin={{ top: 0, right: 0, bottom: 0, left: 80 }}
              >
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis
                  type="category"
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.replace(/_/g, " ")}
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
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* Upcoming Renewals */}
        {data.upcomingRenewals.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <h4 className="text-sm font-medium">Upcoming Renewals</h4>
            </div>
            <div className="space-y-2">
              {data.upcomingRenewals.slice(0, 3).map((renewal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{renewal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(renewal.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {currencyFormatter(renewal.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
