'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DailyTask } from '@/lib/types';
import { useMemo } from 'react';
import { Target } from 'lucide-react';

interface StatusPieChartProps {
  tasks: DailyTask[];
}

export function StatusPieChart({ tasks }: StatusPieChartProps) {
  const data = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    return [
      { name: 'Completed', value: completed, fill: 'oklch(0.60 0.18 150)' },
      { name: 'Pending', value: pending, fill: 'oklch(0.75 0.15 80)' },
    ];
  }, [tasks]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-card glow-card overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight">Completed vs Pending</h3>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium">Overall task completion status</p>
      </div>
      <div className="px-5 pb-5 flex items-center justify-center">
        <div className="h-[280px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
                label={({ name, value }: any) => value > 0 ? `${name}: ${value}` : ''}
                labelLine={true}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black tracking-tight">{total}</span>
            <span className="text-[11px] text-muted-foreground font-medium">Total Tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
