"use client";

import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryStatsProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  monthName: string;
}

export function SummaryStats({ totalIncome, totalExpenses, netBalance, monthName }: SummaryStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
          <CardDescription className="pt-1">{monthName} Income</CardDescription>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</div>
          <CardDescription className="pt-1">{monthName} Expenses</CardDescription>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          {netBalance >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingUp className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatCurrency(netBalance)}
          </div>
          <CardDescription className="pt-1">Savings for {monthName}</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
