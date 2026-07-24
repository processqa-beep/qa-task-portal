'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DailyTask } from '@/lib/types';
import { WORK_TYPES, TASK_STATUSES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Search, Edit, Trash2, CheckCircle2, Clock, Calendar, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface TaskTableProps {
  tasks: DailyTask[];
  onTaskUpdated?: () => void;
  showEmployee?: boolean;
}

const WORK_TYPE_BADGE_STYLES: Record<string, string> = {
  'Testing': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'Regression': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  'Automation': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Bug Verification': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  'Documentation': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Meeting': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  'Cloud Vision': 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  'Data Analysis': 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  'IMS': 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  'Process Audit': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  'Devlopment': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  'Additional': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'Other': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export function TaskTable({ tasks, onTaskUpdated, showEmployee = true }: TaskTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    work_type: '',
    task_performed: '',
    status: '',
    remarks: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const empName = (task.employee as unknown as { name: string })?.name || task.employee_id;
      const matchesSearch =
        !search ||
        task.task_performed.toLowerCase().includes(search.toLowerCase()) ||
        task.employee_id.toLowerCase().includes(search.toLowerCase()) ||
        empName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesWorkType = workTypeFilter === 'all' || task.work_type === workTypeFilter;

      return matchesSearch && matchesStatus && matchesWorkType;
    });
  }, [tasks, search, statusFilter, workTypeFilter]);

  const openEdit = (task: DailyTask) => {
    setEditingTask(task);
    setEditForm({
      work_type: task.work_type,
      task_performed: task.task_performed,
      status: task.status,
      remarks: task.remarks || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingTask) return;
    setIsUpdating(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTask.id, ...editForm }),
      });

      if (!res.ok) throw new Error('Failed to update');

      toast.success('Task updated successfully!');
      setEditingTask(null);
      onTaskUpdated?.();
    } catch {
      toast.error('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      // 1. Direct browser delete in Supabase
      try {
        await supabase.from('daily_tasks').delete().eq('id', id);
      } catch {
        // ignore
      }

      // 2. API fallback
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });

      toast.success('Task deleted successfully!');
      setDeletingTaskId(null);
      onTaskUpdated?.();
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, descriptions, or QA engineers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background/60 border-border/30 font-medium"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs rounded-xl border-border/30 font-semibold">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-card border-border/30">
            <SelectItem value="all">All Status</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={workTypeFilter} onValueChange={(v) => v && setWorkTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs rounded-xl border-border/30 font-semibold">
            <SelectValue placeholder="Work Type" />
          </SelectTrigger>
          <SelectContent className="glass-card border-border/30">
            <SelectItem value="all">All Work Types</SelectItem>
            {WORK_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table (Desktop View) */}
      <div className="hidden md:block glass-card glow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/[0.03] hover:bg-muted/[0.03] border-b border-border/15">
              {showEmployee && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">QA Engineer</TableHead>}
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 w-[120px]">Date</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 w-[140px]">Work Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">Task Details</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 w-[110px]">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 w-[90px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showEmployee ? 6 : 5} className="text-center py-10 text-muted-foreground text-xs font-medium">
                  No task records found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => {
                const empName = (task.employee as unknown as { name: string })?.name || task.employee_id;
                const badgeStyle = WORK_TYPE_BADGE_STYLES[task.work_type] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';

                return (
                  <TableRow key={task.id} className="hover:bg-primary/[0.02] transition-colors border-b border-border/10">
                    {showEmployee && (
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg shimmer-bg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {empName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-foreground leading-none">{empName}</p>
                            <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">{task.employee?.id || task.employee_id}</p>
                          </div>
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="text-xs font-medium text-muted-foreground py-3">
                      {formatDate(task.date, 'MMM dd, yyyy')}
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge variant="outline" className={`text-[9px] px-2 py-0.5 font-bold rounded-lg ${badgeStyle}`}>
                        {task.work_type}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs py-3 max-w-[400px]">
                      <p className="text-foreground leading-relaxed font-medium whitespace-normal break-words">{task.task_performed}</p>
                      {task.remarks && (
                        <p className="text-[10px] text-muted-foreground mt-1 italic font-normal">Note: {task.remarks}</p>
                      )}
                    </TableCell>

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

                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => openEdit(task)}
                          title="Edit Task"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => setDeletingTaskId(task.id)}
                          title="Delete Task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Card View (Mobile) */}
      <div className="md:hidden space-y-3">
        {filteredTasks.map((task) => {
          const empName = (task.employee as unknown as { name: string })?.name || task.employee_id;
          const badgeStyle = WORK_TYPE_BADGE_STYLES[task.work_type] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';

          return (
            <div key={task.id} className="glass-card glow-card p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg shimmer-bg flex items-center justify-center text-white text-[9px] font-bold">
                    {empName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-xs font-bold">{empName}</span>
                </div>
                <Badge variant="outline" className={`text-[9px] font-bold ${badgeStyle}`}>{task.work_type}</Badge>
              </div>

              <p className="text-xs text-foreground font-medium leading-relaxed">{task.task_performed}</p>

              <div className="flex items-center justify-between pt-2 border-t border-border/15 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.date, 'MMM dd, yyyy')}
                </span>
                <div className="flex items-center gap-1">
                  <Badge
                    variant="secondary"
                    className={task.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-bold'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[9px] font-bold'
                    }
                  >
                    {task.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(task)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-red-500" onClick={() => setDeletingTaskId(task.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingTaskId} onOpenChange={() => setDeletingTaskId(null)}>
        <DialogContent className="sm:max-w-[400px] glass-card border-border/30">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight text-red-500 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Task Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Are you sure you want to delete this daily task report? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingTaskId(null)} className="rounded-xl border-border/30 font-semibold">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => deletingTaskId && handleDelete(deletingTaskId)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/20"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-[480px] glass-card border-border/30">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight">Edit Daily Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Work Type</Label>
              <Select value={editForm.work_type} onValueChange={(v) => v && setEditForm({ ...editForm, work_type: v })}>
                <SelectTrigger className="h-10 text-xs rounded-xl border-border/30 font-medium"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-border/30">
                  {WORK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Task Performed</Label>
              <Textarea value={editForm.task_performed} onChange={(e) => setEditForm({ ...editForm, task_performed: e.target.value })} rows={3} className="text-xs rounded-xl border-border/30 font-medium" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => v && setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="h-10 text-xs rounded-xl border-border/30 font-medium"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-border/30">
                  {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Remarks</Label>
              <Textarea value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} rows={2} className="text-xs rounded-xl border-border/30 font-medium" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingTask(null)} className="rounded-xl border-border/30 font-semibold">Cancel</Button>
              <Button size="sm" onClick={handleUpdate} disabled={isUpdating} className="shimmer-bg text-white font-bold rounded-xl shadow-md shadow-primary/20">
                {isUpdating ? 'Updating...' : 'Update Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
