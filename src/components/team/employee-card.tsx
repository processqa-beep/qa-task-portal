'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee, DailyTask } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeCardProps {
  employee: Employee;
  todayTask: DailyTask | null;
  totalTasks: number;
  completionRate: number;
}

export function EmployeeCard({ employee, todayTask, totalTasks, completionRate }: EmployeeCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
      <div className={cn(
        'h-1 transition-colors',
        todayTask?.status === 'Completed' ? 'bg-emerald-500' :
        todayTask ? 'bg-amber-500' : 'bg-muted'
      )} />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">
              {getInitials(employee.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{employee.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{employee.id}</Badge>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">{employee.role}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {todayTask ? (
                todayTask.status === 'Completed' ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Submitted</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600 dark:text-amber-400">Pending</span>
                  </>
                )
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs text-red-500">Not submitted</span>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{totalTasks} tasks · {completionRate}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
