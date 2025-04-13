"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isBefore, isToday } from "date-fns";

type UpcomingPayment = {
  id: string;
  name: string;
  amount: number;
  date: Date;
  type: "expense" | "subscription";
};

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[];
}

export function UpcomingPayments({ payments }: UpcomingPaymentsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusClasses = (date: Date) => {
    if (isBefore(date, new Date()) && !isToday(date)) {
      return "text-red-500";
    } else if (isToday(date)) {
      return "text-yellow-500 font-medium";
    }
    return "text-muted-foreground";
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Upcoming Payments</CardTitle>
        <CardDescription>Your upcoming expenses and subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="space-y-1">
                  <p className="font-medium">{payment.name}</p>
                  <p className={`text-sm ${getStatusClasses(payment.date)}`}>
                    {format(payment.date, "MMM d, yyyy")}
                    {isToday(payment.date) && <span className="ml-2">(Today)</span>}
                    {isBefore(payment.date, new Date()) && !isToday(payment.date) && <span className="ml-2">(Overdue)</span>}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.type === "expense" ? "Expense" : "Subscription"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No upcoming payments in the next 14 days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
