'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DailyTask, Employee } from '@/lib/types';
import { useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { Users } from 'lucide-react';

interface QAProductivityChartProps {
  tasks: DailyTask[];
  employees: Employee[];
}

export function QAProductivityChart({ tasks, employees }: QAProductivityChartProps) {
  const chartData = useMemo(() => {
    // Filter reporting QA members only
    const reportingQA = employees.filter(e => e.id !== 'QA001');

    // Get unique dates for the last 7 days
    const dates = Array.from(new Set(tasks.map(t => t.date)))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7);

    return dates.map(date => {
      const dayData: Record<string, any> = {
        dateName: formatDate(date, 'MMM dd'),
      };

      reportingQA.forEach(qa => {
        // Find tasks for this QA on this date
        const qaTasks = tasks.filter(
          t => (t.employee_id === qa.id || t.employee?.name === qa.name) && t.date === date
        );
        dayData[qa.name.split(' ')[0]] = qaTasks.length;
      });

      return dayData;
    });
  }, [tasks, employees]);

  const colors = ['oklch(0.58 0.22 270)', 'oklch(0.60 0.18 150)', 'oklch(0.75 0.15 80)'];

  return (
    <div className="glass-card glow-card overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight">Daily Productivity Breakdown</h3>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium">Compare task submission volumes over the last 7 active days</p>
      </div>
      <div className="px-5 pb-5">
        {chartData.length === 0 ? (
          <div className="h-60 flex items-center justify-center">
            <p className="text-xs text-muted-foreground font-medium">No data available</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" />
                <XAxis dataKey="dateName" style={{ fontSize: 10, fontWeight: 500 }} tickLine={false} />
                <YAxis style={{ fontSize: 10, fontWeight: 500 }} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, fontWeight: 600 }} />
                {employees
                  .filter(e => e.id !== 'QA001')
                  .map((qa, index) => {
                    const shortName = qa.name.split(' ')[0];
                    return (
                      <Area
                        key={qa.id}
                        type="monotone"
                        dataKey={shortName}
                        stackId="1"
                        stroke={colors[index % colors.length]}
                        fill={colors[index % colors.length]}
                        fillOpacity={0.12}
                        strokeWidth={2.5}
                      />
                    );
                  })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
