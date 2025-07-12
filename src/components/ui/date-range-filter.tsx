"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangeFilterProps {
  value?: [Date, Date] | undefined;
  onChange: (value: [Date, Date] | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangeFilter({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    value ? { from: value[0], to: value[1] } : undefined,
  );

  React.useEffect(() => {
    setDateRange(value ? { from: value[0], to: value[1] } : undefined);
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onChange([range.from, range.to]);
      // Don't close the popover when selecting dates
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {value ? (
            <span className="flex-1 truncate">
              {format(value[0], "MMM d")} - {format(value[1], "MMM d, yyyy")}
            </span>
          ) : (
            <span className="flex-1">{placeholder}</span>
          )}
          {value && (
            <X
              className="ml-2 h-3 w-3 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from || new Date()}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="rounded-lg border shadow-sm"
          />
          {dateRange && (
            <div className="border-t p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setDateRange(undefined);
                  onChange(undefined);
                  // Don't close the popover when clearing
                }}
              >
                Clear selection
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
