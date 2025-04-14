"use client";

import { useState, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ExpenseCategory, IncomeCategory } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { CATEGORY_COLORS } from "@/lib/constants";
import { EventHoverCard } from "./event-hover-card";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type FinanceEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "income" | "expense" | "subscription";
  category: IncomeCategory | ExpenseCategory;
  amount: number;
};

interface FinanceCalendarProps {
  events: FinanceEvent[];
}

const localizer = momentLocalizer(moment);

export function FinanceCalendar({ events }: FinanceCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get the date from query params or use current date
  const dateParam = searchParams.get("date");
  let initialDate = new Date();

  // Check if dateParam exists and is valid
  if (dateParam) {
    const parsedDate = new Date(dateParam);
    if (!isNaN(parsedDate.getTime())) {
      initialDate = parsedDate;
    }
  }

  const [selectedEvent, setSelectedEvent] = useState<FinanceEvent | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [currentDate, setCurrentDate] = useState(initialDate);

  const handleEventClick = (event: FinanceEvent) => {
    setSelectedEvent(event);
  };

  // Handle navigation actions (prev, next, today)
  const handleNavigate = useCallback(
    (newDate: Date) => {
      // Only update if we have a valid date
      if (newDate && newDate instanceof Date && !isNaN(newDate.getTime())) {
        setCurrentDate(newDate);

        // Update URL with new date - format: YYYY-MM-DD
        const formattedDate = moment(newDate).format("YYYY-MM-DD");
        const params = new URLSearchParams(searchParams.toString());
        params.set("date", formattedDate);
        router.push(`${pathname}?${params.toString()}`);
      }
    },
    [router, pathname, searchParams],
  );

  const eventStyleGetter = (event: FinanceEvent) => {
    const categoryColor = CATEGORY_COLORS[event.category];

    return {
      style: {
        backgroundColor: categoryColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
        cursor: "pointer",
      },
    };
  };

  const handleMouseOver = (
    event: React.MouseEvent,
    calendarEvent: FinanceEvent,
  ) => {
    setSelectedEvent(calendarEvent);
    setHoverPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseOut = () => {
    setSelectedEvent(null);
  };

  return (
    <Card className="p-4 h-[80vh]">
      <Calendar
        localizer={localizer}
        events={events || []}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={[Views.MONTH]}
        date={currentDate}
        onNavigate={handleNavigate}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleEventClick}
        popup
        popupOffset={20}
        components={{
          event: ({ event }) => (
            <div
              onMouseOver={(e) => handleMouseOver(e, event as FinanceEvent)}
              onMouseOut={handleMouseOut}
              className="truncate px-1 py-0.5"
            >
              {event.title}
            </div>
          ),
        }}
      />
      {selectedEvent && (
        <EventHoverCard
          event={selectedEvent}
          position={hoverPosition}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </Card>
  );
}
