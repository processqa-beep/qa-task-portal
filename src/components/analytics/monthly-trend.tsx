'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DailyTask } from '@/lib/types';
import { format, parseISO, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useMemo } from 'react';

interface MonthlyTrendProps {
  tasks: DailyTask[];
}

export function MonthlyTrend({ tasks }: MonthlyTrendProps) {
  const data = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map((month) => {
      const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');
      const monthTasks = tasks.filter(
        (t) => t.date >= monthStart && t.date <= monthEnd
      );
      return {
        month: format(month, 'MMM yyyy'),
        completed: monthTasks.filter((t) => t.status === 'Completed').length,
        pending: monthTasks.filter((t) => t.status === 'Pending').length,
        total: monthTasks.length,
      };
    });
  }, [tasks]);

  const chartConfig = {
    completed: { label: 'Completed', color: 'hsl(265, 80%, 60%)' },
    pending: { label: 'Pending', color: 'hsl(280, 70%, 75%)' },
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Monthly Trend</CardTitle>
        <CardDescription>Tasks completed over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="completed" stroke="var(--color-completed)" fill="url(#colorCompleted)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
