"use client";

import { useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ExpenseCategory, IncomeCategory } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { CATEGORY_COLORS } from "@/lib/constants";
import { EventHoverCard } from "./event-hover-card";

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
  const [selectedEvent, setSelectedEvent] = useState<FinanceEvent | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const handleEventClick = (event: FinanceEvent) => {
    setSelectedEvent(event);
  };

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

  const handleMouseOver = (event: React.MouseEvent, calendarEvent: FinanceEvent) => {
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
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={[Views.MONTH]}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleEventClick}
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
