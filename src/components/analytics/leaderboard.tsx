'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyTask, Employee } from '@/lib/types';
import { Trophy, Medal, Award } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  tasks: DailyTask[];
  employees: Employee[];
}

export function Leaderboard({ tasks, employees }: LeaderboardProps) {
  const rankings = useMemo(() => {
    return employees
      .filter((e) => e.id !== 'QA001') // Filter out Team Leader Chhayank Dave
      .map((emp) => {
        const empTasks = tasks.filter((t) => t.employee_id === emp.id || t.employee?.name === emp.name);
        const total = empTasks.length;
        const completed = empTasks.filter((t) => t.status === 'Completed').length;
        const pending = empTasks.filter((t) => t.status === 'Pending').length;
        const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...emp,
          totalTasks: total,
          completed,
          pending,
          completionPercentage: completionPct,
        };
      })
      .sort((a, b) => b.completionPercentage - a.completionPercentage || b.totalTasks - a.totalTasks);
  }, [tasks, employees]);

  const rankIcons = [Trophy, Medal, Award];
  const rankBgColors = [
    'bg-amber-500/10 shadow-sm shadow-amber-500/10',
    'bg-slate-400/10',
    'bg-amber-700/10',
  ];
  const rankIconColors = [
    'text-amber-500',
    'text-slate-400',
    'text-amber-700',
  ];

  return (
    <div className="glass-card glow-card overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-base font-bold tracking-tight">Performance Leaderboard</h3>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">QA Member ranking by completion rate</p>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-2">
          {rankings.map((emp, index) => {
            const RankIcon = rankIcons[index] || null;
            return (
              <div
                key={emp.id}
                className={cn(
                  'flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200',
                  index === 0 && 'bg-amber-500/[0.04] border border-amber-500/10 shadow-sm shadow-amber-500/5',
                  index > 0 && 'hover:bg-muted/20 border border-transparent'
                )}
              >
                <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl', rankBgColors[index] || 'bg-muted/30')}>
                  {RankIcon ? (
                    <RankIcon className={cn('h-4.5 w-4.5', rankIconColors[index])} />
                  ) : (
                    <span className="text-sm font-black text-muted-foreground">#{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate tracking-tight">{emp.name}</p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 rounded-md font-semibold border-border/30">{emp.id}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground font-medium">{emp.totalTasks} tasks</span>
                    <span className="text-[10px] text-emerald-500 font-semibold">{emp.completed} done</span>
                    <span className="text-[10px] text-amber-500 font-semibold">{emp.pending} pending</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className={cn(
                    'text-xl font-black tracking-tight',
                    emp.completionPercentage >= 90 ? 'text-emerald-500' :
                    emp.completionPercentage >= 70 ? 'text-blue-500' :
                    emp.completionPercentage >= 50 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {emp.completionPercentage}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
