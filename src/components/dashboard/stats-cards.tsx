'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Clock,
  Users,
  FileCheck,
  AlertCircle,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  accentColor: string;
  bgColor: string;
}

function StatCard({ title, value, subtitle, icon: Icon, accentColor, bgColor }: StatCardProps) {
  return (
    <div className="glass-card glow-card group p-4 relative">
      {/* Ambient background blob */}
      <div className={cn('absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-[0.15]', bgColor)} />

      <div className="flex items-start justify-between relative">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black tracking-tight leading-none">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl', bgColor)}>
          <Icon className={cn('h-5 w-5', accentColor)} />
        </div>
      </div>
    </div>
  );
}

interface StatsCardsProps {
  stats: {
    totalEmployees: number;
    todaySubmitted: number;
    pendingReports: number;
    completedTasks: number;
    pendingTasks: number;
  } | null;
  employeeStats?: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionPercentage: number;
    currentStreak: number;
  } | null;
  isLeader: boolean;
  isLoading: boolean;
}

export function StatsCards({ stats, employeeStats, isLeader, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-7 w-14 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (isLeader && stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Team Members"
          value={stats.totalEmployees}
          subtitle="Active engineers"
          icon={Users}
          bgColor="bg-violet-500/15"
          accentColor="text-violet-500"
        />
        <StatCard
          title="Today's Reports"
          value={stats.todaySubmitted}
          subtitle={`of ${stats.totalEmployees} submitted`}
          icon={FileCheck}
          bgColor="bg-emerald-500/15"
          accentColor="text-emerald-500"
        />
        <StatCard
          title="Pending Reports"
          value={stats.pendingReports}
          subtitle="Not submitted today"
          icon={AlertCircle}
          bgColor="bg-amber-500/15"
          accentColor="text-amber-500"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          subtitle="All time"
          icon={CheckCircle2}
          bgColor="bg-blue-500/15"
          accentColor="text-blue-500"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          subtitle="Across all members"
          icon={Clock}
          bgColor="bg-rose-500/15"
          accentColor="text-rose-500"
        />
      </div>
    );
  }

  if (employeeStats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={employeeStats.totalTasks}
          subtitle="All time submissions"
          icon={FileCheck}
          bgColor="bg-violet-500/15"
          accentColor="text-violet-500"
        />
        <StatCard
          title="Completed"
          value={employeeStats.completedTasks}
          subtitle={`${employeeStats.completionPercentage}% completion`}
          icon={CheckCircle2}
          bgColor="bg-emerald-500/15"
          accentColor="text-emerald-500"
        />
        <StatCard
          title="Pending"
          value={employeeStats.pendingTasks}
          subtitle="Tasks in progress"
          icon={Clock}
          bgColor="bg-amber-500/15"
          accentColor="text-amber-500"
        />
        <StatCard
          title="Streak"
          value={`${employeeStats.currentStreak} days`}
          subtitle="Consecutive submissions"
          icon={Flame}
          bgColor="bg-orange-500/15"
          accentColor="text-orange-500"
        />
      </div>
    );
  }

  return null;
}
