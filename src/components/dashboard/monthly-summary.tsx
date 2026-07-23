'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface MonthlySummaryProps {
  completionPercentage: number;
  completedTasks: number;
  totalTasks: number;
  isLoading: boolean;
}

export function MonthlySummary({ completionPercentage, completedTasks, totalTasks, isLoading }: MonthlySummaryProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="flex justify-center">
          <Skeleton className="h-36 w-36 rounded-full" />
        </div>
      </div>
    );
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="glass-card glow-card p-6">
      <h3 className="text-base font-bold tracking-tight mb-4">Completion Rate</h3>

      <div className="flex flex-col items-center">
        <div className="relative h-36 w-36">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              className="text-muted/20"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="url(#completionGradient)"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: 'drop-shadow(0 0 6px oklch(0.52 0.2 270 / 30%))'
              }}
            />
            <defs>
              <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.60 0.24 270)" />
                <stop offset="100%" stopColor="oklch(0.50 0.22 250)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black tracking-tight">{completionPercentage}%</span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">complete</span>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-lg font-black text-emerald-500">{completedTasks}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Completed</p>
          </div>
          <div className="h-8 w-px bg-border/30" />
          <div className="text-center">
            <p className="text-lg font-black">{totalTasks}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
