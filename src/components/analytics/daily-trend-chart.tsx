'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DailyTask } from '@/lib/types';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

interface DailyTrendChartProps {
  tasks: DailyTask[];
}

export function DailyTrendChart({ tasks }: DailyTrendChartProps) {
  const data = useMemo(() => {
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    return last14Days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter((t) => t.date === dateStr);
      return {
        date: format(day, 'MMM dd'),
        total: dayTasks.length,
        completed: dayTasks.filter((t) => t.status === 'Completed').length,
        pending: dayTasks.filter((t) => t.status === 'Pending').length,
      };
    });
  }, [tasks]);

  const chartConfig = {
    total: { label: 'Total Tasks', color: 'oklch(0.52 0.2 270)' },
    completed: { label: 'Completed', color: 'oklch(0.60 0.18 150)' },
    pending: { label: 'Pending', color: 'oklch(0.75 0.15 80)' },
  };

  return (
    <div className="glass-card glow-card overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight">Daily Task Trend</h3>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium">Number of tasks completed each day (last 14 days)</p>
      </div>
      <div className="px-5 pb-5">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 500 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10, fontWeight: 500 }} className="text-muted-foreground" allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="pending" stroke="var(--color-pending)" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
