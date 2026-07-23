'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
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

  const chartConfig = {
    completed: { label: 'Completed', color: 'oklch(0.60 0.18 150)' },
    pending: { label: 'Pending', color: 'oklch(0.75 0.15 80)' },
  };

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
      <div className="px-5 pb-5">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <text x="50%" y="45%" textAnchor="middle" className="fill-foreground text-3xl font-black">
              {total}
            </text>
            <text x="50%" y="56%" textAnchor="middle" className="fill-muted-foreground text-[11px] font-medium">
              Total Tasks
            </text>
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
}
