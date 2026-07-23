'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { EmployeeCard } from '@/components/team/employee-card';
import { TaskTable } from '@/components/team/task-table';
import { ExportExcel } from '@/components/export/export-excel';
import { ExportPdf } from '@/components/export/export-pdf';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { getToday } from '@/lib/utils';
import { useRealtimeData } from '@/lib/hooks/use-realtime';

export default function TeamPage() {
  const { employee, isLeader } = useAuth();
  const router = useRouter();
  const { tasks, employees, isLoading, refresh } = useRealtimeData(employee?.id, isLeader);

  useEffect(() => {
    if (!isLeader) {
      router.push('/dashboard');
    }
  }, [isLeader, router]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const today = getToday();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Team Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage team task reports ({tasks.length} total tasks)</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcel tasks={tasks} />
          <ExportPdf tasks={tasks} />
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {employees.map((emp) => {
          const empTasks = tasks.filter(
            (t) => t.employee_id === emp.id || t.employee_id === emp.name || t.employee?.name === emp.name
          );
          const todayTask = empTasks.find((t) => t.date === today) || null;
          const completedCount = empTasks.filter((t) => t.status === 'Completed').length;
          const completionRate = empTasks.length > 0 ? Math.round((completedCount / empTasks.length) * 100) : 0;

          return (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              todayTask={todayTask}
              totalTasks={empTasks.length}
              completionRate={completionRate}
            />
          );
        })}
      </div>

      {/* Task Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="text-xs">All Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <TaskTable tasks={tasks} onTaskUpdated={refresh} />
        </TabsContent>
        <TabsContent value="today">
          <TaskTable tasks={tasks.filter((t) => t.date === today)} onTaskUpdated={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
