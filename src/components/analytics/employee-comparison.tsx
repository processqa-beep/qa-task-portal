'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DailyTask, Employee } from '@/lib/types';
import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

interface EmployeeComparisonProps {
  tasks: DailyTask[];
  employees: Employee[];
}

export function EmployeeComparison({ tasks, employees }: EmployeeComparisonProps) {
  const data = useMemo(() => {
    return employees.map((emp) => {
      const empTasks = tasks.filter((t) => t.employee_id === emp.id);
      return {
        name: emp.name.split(' ')[0],
        completed: empTasks.filter((t) => t.status === 'Completed').length,
        pending: empTasks.filter((t) => t.status === 'Pending').length,
      };
    });
  }, [tasks, employees]);

  const chartConfig = {
    completed: { label: 'Completed', color: 'oklch(0.52 0.2 270)' },
    pending: { label: 'Pending', color: 'oklch(0.72 0.12 270)' },
  };

  return (
    <div className="glass-card glow-card overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight">Employee-wise Task Count</h3>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium">Compare tasks across team members</p>
      </div>
      <div className="px-5 pb-5">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 10, fontWeight: 500 }} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pending" fill="var(--color-pending)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
