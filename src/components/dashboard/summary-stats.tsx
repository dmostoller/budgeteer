"use client";

import {
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
// import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePrivacy } from "@/contexts/privacy-context";
import { formatCurrencyWithPrivacy } from "@/lib/utils";

interface SummaryStatsProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  startDate: Date;
  endDate: Date;
  incomeChange?: number; // Percentage change from previous period
  expensesChange?: number; // Percentage change from previous period
}

export function SummaryStats({
  totalIncome,
  totalExpenses,
  netBalance,
  // startDate,
  // endDate,
  incomeChange = 0,
  expensesChange = 0,
}: SummaryStatsProps) {
  const { isPrivacyMode } = usePrivacy();

  const formatCurrency = (amount: number) => {
    return formatCurrencyWithPrivacy(amount, isPrivacyMode);
  };

  // Format date range for display
  // const dateRangeString = `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Income Card */}
      <Card className="relative overflow-hidden shadow-sm transition-all hover:shadow-md">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Total Income
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="relative pb-0 pt-0">
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(totalIncome)}
          </div>
          {incomeChange !== 0 && (
            <div className="mt-2 flex items-center text-xs">
              <div className="flex items-center rounded-full bg-primary/20 px-2 py-1 text-primary">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                <span>{Math.abs(incomeChange)}%</span>
              </div>
              <CardDescription className="ml-2">
                vs previous period
              </CardDescription>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card className="relative overflow-hidden shadow-sm transition-all hover:shadow-md">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Total Expenses
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent className="relative pb-0 pt-0">
          <div className="text-3xl font-bold text-destructive">
            {formatCurrency(totalExpenses)}
          </div>
          {expensesChange !== 0 && (
            <div className="mt-2 flex items-center text-xs">
              <div className="flex items-center rounded-full bg-destructive/20 px-2 py-1 text-destructive">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                <span>{Math.abs(expensesChange)}%</span>
              </div>
              <CardDescription className="ml-2">
                vs previous period
              </CardDescription>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Net Balance Card */}
      <Card className="relative overflow-hidden shadow-sm transition-all hover:shadow-md">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            netBalance >= 0 ? "from-secondary/10" : "from-orange-500/10"
          } to-transparent`}
        />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Net Balance
          </CardTitle>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              netBalance >= 0 ? "bg-secondary/20" : "bg-orange-500/20"
            }`}
          >
            {netBalance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-secondary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-orange-500" />
            )}
          </div>
        </CardHeader>
        <CardContent className="relative pb-0 pt-0">
          <div
            className={`text-3xl font-bold ${
              netBalance >= 0 ? "text-secondary" : "text-orange-500"
            }`}
          >
            {formatCurrency(netBalance)}
          </div>
          {/* <div className="mt-2 flex items-center text-xs">
            <CardDescription>{dateRangeString}</CardDescription>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
