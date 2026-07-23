'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyTask, Employee } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { PlusCircle, CheckCircle2, Clock, Calendar, FileX, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { sendGoogleChatNotification } from '@/lib/google-chat';
import { toast } from 'sonner';

interface TodayTaskProps {
  task: DailyTask | null;
  tasks?: DailyTask[];
  employees?: Employee[];
  isLoading: boolean;
}

export function TodayTask({ task, tasks = [], employees = [], isLoading }: TodayTaskProps) {
  const [isPostingToChat, setIsPostingToChat] = useState(false);

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const reportingMembers = employees.filter(e => e.role !== 'leader' && e.id !== 'QA001');

  // Build a flat list: for each member, show all their today tasks (or one "not submitted" row)
  const rows: {
    srNo: number;
    empName: string;
    empId: string;
    submitted: boolean;
    workType: string;
    taskPerformed: string;
    status: string;
    remarks: string;
  }[] = [];

  let sr = 1;
  reportingMembers.forEach((emp) => {
    const empTodayTasks = todayTasks.filter(
      (t) => t.employee_id === emp.id || t.employee_id === emp.name || t.employee?.name === emp.name
    );

    if (empTodayTasks.length > 0) {
      empTodayTasks.forEach((t) => {
        rows.push({
          srNo: sr++,
          empName: emp.name,
          empId: emp.id,
          submitted: true,
          workType: t.work_type,
          taskPerformed: t.task_performed,
          status: t.status,
          remarks: t.remarks || '',
        });
      });
    } else {
      rows.push({
        srNo: sr++,
        empName: emp.name,
        empId: emp.id,
        submitted: false,
        workType: '—',
        taskPerformed: 'Not submitted yet',
        status: 'Pending',
        remarks: '',
      });
    }
  });

  const submittedCount = reportingMembers.filter(emp =>
    todayTasks.some(t => t.employee_id === emp.id || t.employee_id === emp.name || t.employee?.name === emp.name)
  ).length;

  const handlePostTeamSummaryToChat = async () => {
    if (todayTasks.length === 0) {
      toast.error('No tasks submitted today yet to send');
      return;
    }

    setIsPostingToChat(true);
    try {
      let totalPosted = 0;

      // Group tasks by reporting member and send each member's summary card
      for (const emp of reportingMembers) {
        const empTasks = todayTasks.filter(
          t => t.employee_id === emp.id || t.employee_id === emp.name || t.employee?.name === emp.name
        );

        if (empTasks.length > 0) {
          const res = await sendGoogleChatNotification({
            employeeName: emp.name,
            employeeId: emp.id,
            date: todayStr,
            tasks: empTasks.map(t => ({
              work_type: t.work_type,
              task_performed: t.task_performed,
              status: t.status,
              remarks: t.remarks,
            })),
          });
          if (res.success) totalPosted++;
        }
      }

      if (totalPosted > 0) {
        toast.success(`Posted today's daily summary for ${totalPosted} QA member(s) to Google Chat!`);
      } else {
        toast.error('Failed to post summary to Google Chat', {
          description: 'Please make sure Google Chat Webhook URL is configured in Submit Task.',
        });
      }
    } catch {
      toast.error('Error posting summary to Google Chat');
    } finally {
      setIsPostingToChat(false);
    }
  };

  return (
    <div className="glass-card glow-card overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 shimmer-bg" />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Today&apos;s Report Summary</h3>
            <p className="text-[11px] text-muted-foreground font-medium">
              {formatDate(new Date(), 'EEEE, MMMM dd, yyyy')} · <span className="text-primary font-bold">{submittedCount}/{reportingMembers.length}</span> submitted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePostTeamSummaryToChat}
            disabled={isPostingToChat}
            className="text-xs h-9 rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold"
          >
            {isPostingToChat ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
            )}
            Post Summary to Google Chat
          </Button>

          <Link href="/submit">
            <Button size="sm" className="shimmer-bg text-white text-xs h-9 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all font-semibold">
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              Submit / Edit Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Full Report Table */}
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/[0.03] hover:bg-muted/[0.03] border-y border-border/15">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-2.5 w-[50px] text-center">Sr</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-2.5 w-[160px]">QA Member</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-2.5 w-[110px]">Work Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-2.5">Task Performed</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-2.5 w-[90px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={idx}
                className={`border-b border-border/10 transition-colors ${
                  row.submitted ? 'hover:bg-primary/[0.02]' : 'bg-amber-500/[0.02] hover:bg-amber-500/[0.04]'
                }`}
              >
                {/* Sr No */}
                <TableCell className="py-3 text-center">
                  <span className="text-[11px] font-bold text-muted-foreground">{row.srNo}</span>
                </TableCell>

                {/* QA Member */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                      row.submitted
                        ? 'shimmer-bg shadow-sm shadow-primary/10'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {row.empName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-tight leading-none">{row.empName}</p>
                      <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">{row.empId}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Work Type */}
                <TableCell className="py-3">
                  {row.submitted ? (
                    <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-primary/[0.04] text-primary border-primary/15">
                      {row.workType}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/50 font-medium">—</span>
                  )}
                </TableCell>

                {/* Task Performed */}
                <TableCell className="py-3">
                  {row.submitted ? (
                    <div>
                      <p className="text-xs font-medium leading-relaxed whitespace-normal break-words">{row.taskPerformed}</p>
                      {row.remarks && (
                        <p className="text-[10px] text-muted-foreground mt-1 italic font-normal">Note: {row.remarks}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <FileX className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-semibold">Not submitted yet</span>
                    </div>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="py-3">
                  {row.submitted ? (
                    <Badge
                      variant="secondary"
                      className={row.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-bold rounded-lg'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[9px] font-bold rounded-lg'
                      }
                    >
                      {row.status === 'Completed' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {row.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] text-amber-600 dark:text-amber-400 border-amber-500/15 bg-amber-500/5 font-bold rounded-lg">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
