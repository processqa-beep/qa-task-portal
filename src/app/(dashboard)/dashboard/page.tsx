'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { TodayTask } from '@/components/dashboard/today-task';
import { RecentTasks } from '@/components/dashboard/recent-tasks';
import { CalendarView } from '@/components/dashboard/calendar-view';
import { MonthlySummary } from '@/components/dashboard/monthly-summary';
import { getToday, formatDate, toStandardDateStr } from '@/lib/utils';
import { useRealtimeData } from '@/lib/hooks/use-realtime';

// Import analytics components to merge them
import { DailyTrendChart } from '@/components/analytics/daily-trend-chart';
import { StatusPieChart } from '@/components/analytics/status-pie-chart';
import { WorkTypeChart } from '@/components/analytics/work-type-chart';
import { Leaderboard } from '@/components/analytics/leaderboard';
import { EmployeeComparison } from '@/components/analytics/employee-comparison';
import { QAProductivityChart } from '@/components/analytics/qa-productivity-chart';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Calendar, Filter, BarChart3, Sparkles } from 'lucide-react';


export default function DashboardPage() {
  const { employee, isLeader } = useAuth();
  const { tasks, employees, isLoading } = useRealtimeData(employee?.id, isLeader);

  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  const today = getToday();

  const reportingQA = useMemo(() => {
    return employees.filter(e => e.id !== 'QA001'); // Filter out Team Leader Chhayank Dave
  }, [employees]);

  // Filter tasks based on selected QA member and selected Date
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const selectedEmp = employees.find((e) => e.id === selectedEmpFilter);
      const matchesEmp =
        selectedEmpFilter === 'all' ||
        t.employee_id === selectedEmpFilter ||
        t.employee_id === selectedEmp?.name ||
        t.employee?.id === selectedEmpFilter;

      const taskDate = toStandardDateStr(t.date || t.created_at);
      const matchesDate = !selectedDateFilter || taskDate === selectedDateFilter;

      return matchesEmp && matchesDate;
    });
  }, [tasks, selectedEmpFilter, selectedDateFilter, employees]);

  // Synchronous stats computation for the filtered selection
  const stats = useMemo(() => {
    const totalEmps = reportingQA.length || 3;
    const targetDate = selectedDateFilter || today;
    const dateSub = new Set(
      filteredTasks.filter(t => toStandardDateStr(t.date || t.created_at) === targetDate).map(t => t.employee_id)
    ).size;
    const completed = filteredTasks.filter(t => t.status === 'Completed').length;
    const pending = filteredTasks.filter(t => t.status === 'Pending').length;

    return {
      totalEmployees: totalEmps,
      todaySubmitted: dateSub,
      pendingReports: Math.max(0, totalEmps - dateSub),
      completedTasks: completed,
      pendingTasks: pending,
    };
  }, [filteredTasks, reportingQA, today, selectedDateFilter]);

  const employeeStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'Completed').length;
    const pending = filteredTasks.filter(t => t.status === 'Pending').length;

    return {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      currentStreak: total > 0 ? 3 : 0,
    };
  }, [filteredTasks]);

  const todayTask = useMemo(() => {
    const targetDate = selectedDateFilter || today;
    if (selectedEmpFilter !== 'all') {
      return filteredTasks.find(t => toStandardDateStr(t.date || t.created_at) === targetDate) || null;
    }
    if (!employee) return null;
    return tasks.find(t => t.employee_id === employee.id && toStandardDateStr(t.date || t.created_at) === targetDate) || null;
  }, [filteredTasks, tasks, employee, selectedEmpFilter, selectedDateFilter, today]);

  const recentTasks = useMemo(() => filteredTasks.slice(0, 10), [filteredTasks]);

  return (
    <div className="space-y-6">
      {/* Unified QA Member & Date Filter Bar */}
      <div className="glass-card glow-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mr-1 shrink-0 font-semibold">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>QA Member:</span>
          </div>
          <Button
            variant={selectedEmpFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedEmpFilter('all')}
            className={`text-xs h-8 rounded-xl font-semibold ${selectedEmpFilter === 'all' ? 'shimmer-bg text-white shadow-md shadow-primary/15 border-0' : 'border-border/30 hover:bg-primary/5'}`}
          >
            All QA Members
          </Button>
          {reportingQA.map((emp) => (
            <Button
              key={emp.id}
              variant={selectedEmpFilter === emp.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedEmpFilter(emp.id)}
              className={`text-xs h-8 rounded-xl shrink-0 font-semibold ${selectedEmpFilter === emp.id ? 'shimmer-bg text-white shadow-md shadow-primary/15 border-0' : 'border-border/30 hover:bg-primary/5'}`}
            >
              {emp.name.split(' ')[0]}
            </Button>
          ))}
        </div>

        {/* Global Date Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-muted-foreground shrink-0 font-semibold flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Date:</span>
          </span>
          <Input
            type="date"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="h-8 text-xs w-[140px] rounded-xl border-border/30 bg-background/80 font-medium"
          />
          <Button
            variant={selectedDateFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDateFilter('')}
            className={`text-[11px] h-8 px-3 rounded-xl font-bold ${selectedDateFilter === '' ? 'shimmer-bg text-white border-0' : 'border-border/30'}`}
          >
            All Dates
          </Button>
          <Button
            variant={selectedDateFilter === today ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDateFilter(today)}
            className={`text-[11px] h-8 px-3 rounded-xl font-bold ${selectedDateFilter === today ? 'shimmer-bg text-white border-0' : 'border-border/30'}`}
          >
            Today
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <StatsCards
        stats={stats}
        employeeStats={employeeStats}
        isLeader={true}
        isLoading={isLoading}
      />

      {/* Full-Width Row 1: Today / Selected Date Summary */}
      <TodayTask
        task={todayTask}
        tasks={tasks}
        employees={employees}
        isLoading={isLoading}
        selectedDate={selectedDateFilter}
        onDateChange={setSelectedDateFilter}
      />

      {/* Full-Width Row 2: Recent QA Activity Log Table */}
      <RecentTasks tasks={recentTasks} isLoading={isLoading} />

      {/* Row 3: Leaderboard & Task Completion Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Leaderboard tasks={filteredTasks} employees={employees} />
        </div>
        <div className="lg:col-span-1">
          <MonthlySummary
            completionPercentage={employeeStats?.completionPercentage || 0}
            completedTasks={employeeStats?.completedTasks || 0}
            totalTasks={employeeStats?.totalTasks || 0}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-border/20" />
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/[0.04] border border-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-bold text-primary tracking-tight">Interactive Analytics</span>
        </div>
        <div className="h-px flex-1 bg-border/20" />
      </div>

      {/* Integrated Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QAProductivityChart tasks={filteredTasks} employees={employees} />
        <EmployeeComparison tasks={filteredTasks} employees={employees} />
        <DailyTrendChart tasks={filteredTasks} />
        <StatusPieChart tasks={filteredTasks} />
        <WorkTypeChart tasks={filteredTasks} />
        <CalendarView tasks={filteredTasks} isLoading={isLoading} />
      </div>
    </div>
  );
}
