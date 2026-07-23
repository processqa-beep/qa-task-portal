'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { DailyTask } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, isAfter, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  tasks: DailyTask[];
  isLoading: boolean;
}

export function CalendarView({ tasks, isLoading }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDayIndex = getDay(monthStart);

  const taskDates = new Set(tasks.map((t) => t.date));

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    );
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-card glow-card overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold tracking-tight">Submission Calendar</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/5" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[11px] font-bold min-w-[110px] text-center tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/5" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-[10px] font-bold text-muted-foreground/60 py-1 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for starting offset */}
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasTask = taskDates.has(dateStr);
            const isPast = isBefore(startOfDay(day), startOfDay(new Date())) && !isToday(day);
            const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
            const isWeekend = getDay(day) === 0 || getDay(day) === 6;

            return (
              <div
                key={dateStr}
                className={cn(
                  'h-9 rounded-lg flex items-center justify-center text-xs relative transition-all duration-200 font-medium',
                  isToday(day) && 'ring-2 ring-primary/40 font-bold bg-primary/[0.04]',
                  hasTask && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold',
                  isPast && !hasTask && !isWeekend && 'bg-red-500/[0.06] text-red-400/80',
                  isFuture && 'text-muted-foreground/40',
                  isWeekend && !hasTask && 'text-muted-foreground/25',
                )}
              >
                {format(day, 'd')}
                {hasTask && (
                  <CheckCircle2 className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-emerald-500" />
                )}
                {isPast && !hasTask && !isWeekend && (
                  <XCircle className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-red-400/60" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
            <span className="text-[10px] text-muted-foreground font-medium">Submitted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-sm shadow-red-400/30" />
            <span className="text-[10px] text-muted-foreground font-medium">Missed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
