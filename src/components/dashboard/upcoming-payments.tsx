"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, isBefore, isToday } from "date-fns";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

export function UpcomingPayments({
  payments: initialPayments,
}: UpcomingPaymentsProps) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
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

  const handleMarkAsPaid = async (paymentId: string, type: string) => {
    if (type !== "subscription") {
      toast.error("Can only mark subscriptions as paid");
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(paymentId));

    try {
      const response = await fetch(
        `/api/subscriptions/${paymentId}/mark-paid`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to mark as paid");
      }

      // Remove from local state
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      toast.success("Payment marked as paid");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update payment");
      console.error(error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  const handleCancel = async (paymentId: string, type: string) => {
    if (type !== "subscription") {
      toast.error("Can only cancel subscriptions");
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(paymentId));

    try {
      const response = await fetch(
        `/api/subscriptions/${paymentId}/deactivate`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      // Remove from local state
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      toast.success("Subscription cancelled");
      router.refresh();
    } catch (error) {
      toast.error("Failed to cancel subscription");
      console.error(error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Upcoming Payments</CardTitle>
        <CardDescription>
          Your upcoming expenses and subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="space-y-1">
                  <p className="font-medium">{payment.name}</p>
                  <p className={`text-sm ${getStatusClasses(payment.date)}`}>
                    {format(payment.date, "MMM d, yyyy")}
                    {isToday(payment.date) && (
                      <span className="ml-2">(Today)</span>
                    )}
                    {isBefore(payment.date, new Date()) &&
                      !isToday(payment.date) && (
                        <span className="ml-2">(Overdue)</span>
                      )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.type === "expense" ? "Expense" : "Subscription"}
                    </p>
                  </div>
                  {payment.type === "subscription" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleMarkAsPaid(payment.id, payment.type)
                        }
                        disabled={processingIds.has(payment.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Paid
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(payment.id, payment.type)}
                        disabled={processingIds.has(payment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
