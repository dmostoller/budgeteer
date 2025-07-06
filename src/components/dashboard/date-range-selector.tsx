"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

type PresetRange = {
  label: string;
  getValue: () => DateRange;
};

export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string>("1");

  const presetRanges: PresetRange[] = [
    {
      label: "Last month",
      getValue: () => ({
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1)),
      }),
    },
    {
      label: "Last 3 months",
      getValue: () => ({
        from: startOfMonth(subMonths(new Date(), 2)),
        to: endOfMonth(new Date()),
      }),
    },
    {
      label: "Last 6 months",
      getValue: () => ({
        from: startOfMonth(subMonths(new Date(), 5)),
        to: endOfMonth(new Date()),
      }),
    },
    {
      label: "This year",
      getValue: () => ({
        from: new Date(new Date().getFullYear(), 0, 1),
        to: endOfMonth(new Date()),
      }),
    },
    {
      label: "Last year",
      getValue: () => {
        const lastYear = new Date().getFullYear() - 1;
        return {
          from: new Date(lastYear, 0, 1),
          to: new Date(lastYear, 11, 31),
        };
      },
    },
  ];

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value === "custom") {
      // Keep the current date range when switching to custom
      return;
    }
    const preset = presetRanges[parseInt(value)];
    if (preset) {
      onDateRangeChange(preset.getValue());
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range);
    setSelectedPreset("custom");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Last month</SelectItem>
          <SelectItem value="1">Last 3 months</SelectItem>
          <SelectItem value="2">Last 6 months</SelectItem>
          <SelectItem value="3">This year</SelectItem>
          <SelectItem value="4">Last year</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
