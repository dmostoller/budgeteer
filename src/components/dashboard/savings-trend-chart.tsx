"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths, format } from "date-fns";

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleData, setVisibleData] = useState<MonthlyData[]>([]);

  // Calculate which 5 months to show (current month in the middle, 2 before, 2 after)
  useEffect(() => {
    // Process data to include date objects for easier manipulation
    const processedData = data.map((item) => {
      const [monthName, year] = item.month.split(" ");
      // Convert month name to month number (0-indexed)
      const monthNum = new Date(`${monthName} 1, ${year}`).getMonth();
      return {
        ...item,
        savings: item.income - item.expenses,
        date: new Date(parseInt(year), monthNum, 1),
      };
    });

    // Find 2 months before and 2 months after current date
    const currentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    const twoMonthsBefore = subMonths(currentMonth, 2);
    const oneMonthBefore = subMonths(currentMonth, 1);
    const oneMonthAfter = addMonths(currentMonth, 1);
    const twoMonthsAfter = addMonths(currentMonth, 2);

    const monthsToShow = [
      twoMonthsBefore,
      oneMonthBefore,
      currentMonth,
      oneMonthAfter,
      twoMonthsAfter,
    ];

    // Filter data for these months, or create placeholder data if missing
    const filteredData = monthsToShow.map((month) => {
      const foundData = processedData.find(
        (item) =>
          item.date.getMonth() === month.getMonth() &&
          item.date.getFullYear() === month.getFullYear(),
      );

      if (foundData) {
        return {
          month: foundData.month,
          income: foundData.income,
          expenses: foundData.expenses,
          savings: foundData.savings,
        };
      } else {
        // Create placeholder data for months that don't exist in the original data
        return {
          month: format(month, "MMM yyyy"),
          income: 0,
          expenses: 0,
          savings: 0,
        };
      }
    });

    setVisibleData(filteredData);
  }, [data, currentDate]);

  // Navigate backward 1 month
  const handlePrevMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1));
  };

  // Navigate forward 1 month
  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Savings Trend</CardTitle>
            <CardDescription>Monthly savings over time</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={visibleData}
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
