'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Tooltip } from 'recharts';
import { DailyTask, Employee } from '@/lib/types';
import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

interface EmployeeComparisonProps {
  tasks: DailyTask[];
  employees: Employee[];
}

export function EmployeeComparison({ tasks, employees }: EmployeeComparisonProps) {
  const data = useMemo(() => {
    const reportingQA = employees.filter(emp => emp.id !== 'QA001' && emp.name !== 'Chhayank Dave');
    return reportingQA.map((emp) => {
      const empTasks = tasks.filter((t) => t.employee_id === emp.id || t.employee_id === emp.name || t.employee?.name === emp.name);
      return {
        name: emp.name.split(' ')[0],
        completed: empTasks.filter((t) => t.status === 'Completed').length,
        pending: empTasks.filter((t) => t.status === 'Pending').length,
      };
    });
  }, [tasks, employees]);

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
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 10, fontWeight: 500 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
              <Bar dataKey="completed" fill="oklch(0.52 0.2 270)" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="completed" position="top" style={{ fontSize: 11, fontWeight: 800, fill: 'oklch(0.52 0.2 270)' }} formatter={(v: any) => Number(v) > 0 ? String(v) : ''} />
              </Bar>
              <Bar dataKey="pending" fill="oklch(0.72 0.12 270)" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="pending" position="top" style={{ fontSize: 11, fontWeight: 800, fill: 'oklch(0.72 0.12 270)' }} formatter={(v: any) => Number(v) > 0 ? String(v) : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
