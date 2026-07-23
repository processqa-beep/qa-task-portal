'use client';

import { useState, useMemo } from 'react';
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
import { Search, Edit, CheckCircle2, Clock, Calendar, User, Tag } from 'lucide-react';
import { toast } from 'sonner';

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
  const [editForm, setEditForm] = useState({
    work_type: '',
    task_performed: '',
    status: '',
    remarks: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

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
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={workTypeFilter} onValueChange={(v) => v && setWorkTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
            <SelectValue placeholder="Work Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Work Types</SelectItem>
            {WORK_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table (Desktop View) */}
      <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/50">
              {showEmployee && <TableHead className="text-xs font-semibold py-3">QA Engineer</TableHead>}
              <TableHead className="text-xs font-semibold py-3 w-[120px]">Date</TableHead>
              <TableHead className="text-xs font-semibold py-3 w-[150px]">Work Type</TableHead>
              <TableHead className="text-xs font-semibold py-3">Task Details</TableHead>
              <TableHead className="text-xs font-semibold py-3 w-[110px]">Status</TableHead>
              <TableHead className="text-xs font-semibold py-3 w-[60px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showEmployee ? 6 : 5} className="text-center py-10 text-muted-foreground text-xs">
                  No task records found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => {
                const empName = (task.employee as unknown as { name: string })?.name || task.employee_id;
                const badgeStyle = WORK_TYPE_BADGE_STYLES[task.work_type] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';

                return (
                  <TableRow key={task.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                    {showEmployee && (
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {empName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-foreground leading-none">{empName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{task.employee?.id || task.employee_id}</p>
                          </div>
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="text-xs font-medium text-muted-foreground py-3">
                      {formatDate(task.date, 'MMM dd, yyyy')}
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium rounded-md ${badgeStyle}`}>
                        {task.work_type}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs py-3 max-w-[400px]">
                      <p className="text-foreground leading-relaxed font-normal">{task.task_performed}</p>
                      {task.remarks && (
                        <p className="text-[11px] text-muted-foreground mt-1 italic">Note: {task.remarks}</p>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge
                        variant="secondary"
                        className={task.status === 'Completed'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] font-medium'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[10px] font-medium'
                        }
                      >
                        {task.status === 'Completed' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {task.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-violet-500" onClick={() => openEdit(task)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
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
            <div key={task.id} className="p-3.5 rounded-xl border border-border/50 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-xs font-semibold">{empName}</span>
                </div>
                <Badge variant="outline" className={`text-[10px] ${badgeStyle}`}>{task.work_type}</Badge>
              </div>

              <p className="text-xs text-foreground leading-relaxed">{task.task_performed}</p>

              <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.date, 'MMM dd, yyyy')}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={task.status === 'Completed'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[10px]'
                    }
                  >
                    {task.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(task)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Daily Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Work Type</Label>
              <Select value={editForm.work_type} onValueChange={(v) => v && setEditForm({ ...editForm, work_type: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Task Performed</Label>
              <Textarea value={editForm.task_performed} onChange={(e) => setEditForm({ ...editForm, task_performed: e.target.value })} rows={3} className="text-xs" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => v && setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Remarks</Label>
              <Textarea value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} rows={2} className="text-xs" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingTask(null)}>Cancel</Button>
              <Button size="sm" onClick={handleUpdate} disabled={isUpdating} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                {isUpdating ? 'Updating...' : 'Update Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
