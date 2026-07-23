'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyTask, WorkType } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, Clock, ArrowRight, Table as TableIcon, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { WORK_TYPE_COLORS } from '@/lib/constants';

interface RecentTasksProps {
  tasks: DailyTask[];
  isLoading: boolean;
}

const WORK_TYPE_BADGE_STYLES: Record<string, string> = {
  'Testing': 'bg-blue-500/8 text-blue-600 dark:text-blue-400 border-blue-500/15',
  'Regression': 'bg-purple-500/8 text-purple-600 dark:text-purple-400 border-purple-500/15',
  'Automation': 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/15',
  'Bug Verification': 'bg-rose-500/8 text-rose-600 dark:text-rose-400 border-rose-500/15',
  'Documentation': 'bg-amber-500/8 text-amber-600 dark:text-amber-400 border-amber-500/15',
  'Meeting': 'bg-cyan-500/8 text-cyan-600 dark:text-cyan-400 border-cyan-500/15',
  'Cloud Vision': 'bg-violet-500/8 text-violet-600 dark:text-violet-400 border-violet-500/15',
  'Data Analysis': 'bg-teal-500/8 text-teal-600 dark:text-teal-400 border-teal-500/15',
  'IMS': 'bg-pink-500/8 text-pink-600 dark:text-pink-400 border-pink-500/15',
  'Process Audit': 'bg-orange-500/8 text-orange-600 dark:text-orange-400 border-orange-500/15',
  'Devlopment': 'bg-indigo-500/8 text-indigo-600 dark:text-indigo-400 border-indigo-500/15',
  'Additional': 'bg-sky-500/8 text-sky-600 dark:text-sky-400 border-sky-500/15',
  'Other': 'bg-slate-500/8 text-slate-600 dark:text-slate-400 border-slate-500/15',
};

export function RecentTasks({ tasks, isLoading }: RecentTasksProps) {
  const [taskSearch, setTaskSearch] = useState('');

  const filtered = tasks.filter(t =>
    !taskSearch ||
    t.task_performed.toLowerCase().includes(taskSearch.toLowerCase()) ||
    t.work_type.toLowerCase().includes(taskSearch.toLowerCase()) ||
    (t.employee?.name || t.employee_id).toLowerCase().includes(taskSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="glass-card glow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/20 bg-muted/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TableIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Recent QA Activity Log</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Detailed logs of submitted daily tasks</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="h-9 text-xs w-[180px] bg-background/60 pl-8 rounded-xl border-border/30 focus:border-primary/30"
              />
            </div>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-xs h-9 rounded-xl hover:bg-primary/5 font-semibold">
                View All ({tasks.length})
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-0">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
              <Search className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">No recent task logs matching filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/[0.03] hover:bg-muted/[0.03] border-b border-border/20">
                  <TableHead className="text-[11px] font-bold py-3 w-[150px] uppercase tracking-widest text-muted-foreground">QA Member</TableHead>
                  <TableHead className="text-[11px] font-bold py-3 w-[95px] uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-[11px] font-bold py-3 w-[120px] uppercase tracking-widest text-muted-foreground">Work Type</TableHead>
                  <TableHead className="text-[11px] font-bold py-3 uppercase tracking-widest text-muted-foreground">Task Description</TableHead>
                  <TableHead className="text-[11px] font-bold py-3 w-[100px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 15).map((task, index) => {
                  const empName = task.employee?.name || task.employee_id;
                  const empId = task.employee?.id || task.employee_id;
                  const badgeClass = WORK_TYPE_BADGE_STYLES[task.work_type] || 'bg-slate-500/8 text-slate-600 border-slate-500/15';

                  return (
                    <TableRow key={task.id} className="hover:bg-primary/[0.02] border-b border-border/15 transition-colors">
                      {/* QA Member profile */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg shimmer-bg flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm shadow-primary/10">
                            {empName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-none tracking-tight">{empName}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5 font-semibold">{empId}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 text-xs font-semibold tracking-tight">
                        {formatDate(task.date, 'MMM dd, yyyy')}
                      </TableCell>

                      {/* Work Type Badge */}
                      <TableCell className="py-3">
                        <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${badgeClass}`}>
                          {task.work_type}
                        </Badge>
                      </TableCell>

                      {/* Task details */}
                      <TableCell className="py-3 text-xs whitespace-normal break-words font-medium leading-relaxed">
                        <p>{task.task_performed}</p>
                        {task.remarks && (
                          <span className="text-[10px] text-muted-foreground mt-1 block italic font-normal">Note: {task.remarks}</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        <Badge
                          variant="secondary"
                          className={task.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-bold rounded-lg'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[9px] font-bold rounded-lg'
                          }
                        >
                          {task.status === 'Completed' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {task.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
