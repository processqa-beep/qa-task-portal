'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { DailyTask } from '@/lib/types';
import { WORK_TYPES, WORK_TYPE_COLORS } from '@/lib/constants';
import { useMemo } from 'react';
import { Layers } from 'lucide-react';

interface WorkTypeChartProps {
  tasks: DailyTask[];
}

export function WorkTypeChart({ tasks }: WorkTypeChartProps) {
  const data = useMemo(() => {
    return WORK_TYPES.map((type) => ({
      name: type,
      count: tasks.filter((t) => t.work_type === type).length,
      fill: WORK_TYPE_COLORS[type],
    })).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  }, [tasks]);

  const chartConfig = WORK_TYPES.reduce((acc, type) => {
    acc[type] = { label: type, color: WORK_TYPE_COLORS[type] };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <div className="glass-card glow-card overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight">Work Type Distribution</h3>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium">Breakdown by type of work</p>
      </div>
      <div className="px-5 pb-5">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fontWeight: 500 }} allowDecimals={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 500 }} width={100} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
