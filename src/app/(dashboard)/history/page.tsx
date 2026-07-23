'use client';

import { useAuth } from '@/providers/auth-provider';
import { TaskTable } from '@/components/team/task-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealtimeData } from '@/lib/hooks/use-realtime';
import { History } from 'lucide-react';

export default function HistoryPage() {
  const { employee, isLeader } = useAuth();
  const { tasks, isLoading, refresh } = useRealtimeData(employee?.id, isLeader);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Task History
        </h1>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">View and search all team daily task reports ({tasks.length} entries)</p>
      </div>
      <TaskTable tasks={tasks} showEmployee={true} onTaskUpdated={refresh} />
    </div>
  );
}
