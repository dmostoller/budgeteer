"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecurrencePeriod } from "@prisma/client";
import { RECURRENCE_PERIODS } from "@/lib/constants";

interface RecurringSelectCellProps {
  isRecurring: boolean;
  recurrencePeriod?: RecurrencePeriod | null;
  onRecurringChange: (isRecurring: boolean) => void;
  isUpdating: boolean;
}

export function RecurringSelectCell({
  isRecurring,
  recurrencePeriod,
  onRecurringChange,
  isUpdating,
}: RecurringSelectCellProps) {
  const getRecurrencePeriodLabel = (
    value: RecurrencePeriod | null | undefined,
  ) => {
    if (!value) return "";
    return RECURRENCE_PERIODS.find((p) => p.value === value)?.label || value;
  };

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={String(isRecurring)}
        onValueChange={(value) => onRecurringChange(value === "true")}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[80px] h-8 text-xs">
          <SelectValue>{isRecurring ? "Yes" : "No"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
      {recurrencePeriod && (
        <span className="text-xs text-muted-foreground">
          {getRecurrencePeriodLabel(recurrencePeriod)}
        </span>
      )}
    </div>
  );
}
