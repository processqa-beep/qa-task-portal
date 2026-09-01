'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { AssignedTask, TaskPriority, AssignedTaskStatus, Employee } from '@/lib/types';
import { formatDate, getToday } from '@/lib/utils';
import { ClipboardList, PlusCircle, CheckCircle2, Clock, AlertCircle, User, Calendar, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const REPORTING_ENGINEERS: Employee[] = [
  { id: 'QA002', name: 'Hiren Dodiya', role: 'employee', pin: '1234', created_at: '' },
  { id: 'QA003', name: 'Purvesh Kapadiya', role: 'employee', pin: '1234', created_at: '' },
  { id: 'QA004', name: 'Mehul Chikhaliya', role: 'employee', pin: '1234', created_at: '' },
];

export function TaskAssignmentView() {
  const { employee } = useAuth();
  const [assignments, setAssignments] = useState<AssignedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [assignTo, setAssignTo] = useState('QA002');
  const [dueDate, setDueDate] = useState(getToday());
  const [priority, setPriority] = useState<TaskPriority>('High');

  // Fetch assignments directly from Supabase API (no local storage isolations)
  const fetchAssignments = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);

    try {
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const data = await res.json();
        if (data.assignments && Array.isArray(data.assignments)) {
          setAssignments(data.assignments);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch assignments from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments(true);

    // Poll every 4s so changes on any device automatically reflect across all devices
    const interval = setInterval(() => fetchAssignments(false), 4000);
    return () => clearInterval(interval);
  }, [fetchAssignments]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error('Please enter task title and description');
      return;
    }

    setIsSubmitting(true);
    const assigneeObj = REPORTING_ENGINEERS.find((e) => e.id === assignTo);
    const assignedByName = employee?.name ? `${employee.name} (${employee.id})` : 'Chhayank Dave (QA001)';

    const newTask: AssignedTask = {
      id: `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      assigned_to: assignTo,
      assigned_by: assignedByName,
      due_date: dueDate,
      priority,
      status: 'Assigned',
      created_at: new Date().toISOString(),
      assignee: assigneeObj,
    };

    // Optimistic UI update
    setAssignments((prev) => [newTask, ...prev]);
    toast.success(`Task assigned to ${assigneeObj?.name || assignTo}!`, {
      description: 'Saved to Supabase & notification card sent to Google Chat.',
    });

    setNewTitle('');
    setNewDesc('');
    setOpenModal(false);
    setIsSubmitting(false);

    // Save directly to Supabase table
    try {
      await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          assigned_to: newTask.assigned_to,
          assigned_by: newTask.assigned_by,
          due_date: newTask.due_date,
          priority: newTask.priority,
        }),
      });
      fetchAssignments(false);
    } catch {
      toast.error('Failed to sync assignment to Supabase');
    }
  };

  const handleStatusChange = async (id: string, newStatus: AssignedTaskStatus) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    toast.success(`Status updated to ${newStatus}`);

    try {
      await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchAssignments(false);
    } catch {
      toast.error('Failed to sync status update to Supabase');
    }
  };

  const handleDeleteTask = async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    toast.success('Task assignment deleted');

    try {
      await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' });
      fetchAssignments(false);
    } catch {
      toast.error('Failed to delete assignment from Supabase');
    }
  };

  const handleDeleteCompleted = async () => {
    const completedCount = assignments.filter((a) => a.status === 'Completed').length;
    if (completedCount === 0) {
      toast.info('No completed tasks to delete');
      return;
    }

    setAssignments((prev) => prev.filter((a) => a.status !== 'Completed'));
    toast.success(`Deleted ${completedCount} completed task(s)`);

    try {
      await fetch('/api/assignments?deleteAllOld=true', { method: 'DELETE' });
      fetchAssignments(false);
    } catch {
      toast.error('Failed to clear completed assignments from Supabase');
    }
  };

  const filteredTasks = assignments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Assign & Track Tasks
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Assign priority operational tasks to QA team members (Synced live via Supabase across all devices)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {assignments.some((a) => a.status === 'Completed') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteCompleted}
              className="text-xs h-10 rounded-xl border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear Completed
            </Button>
          )}

          <Button onClick={() => setOpenModal(true)} className="shimmer-bg text-white h-10 rounded-xl px-4 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 font-bold text-xs">
            <PlusCircle className="h-4 w-4 mr-2" />
            Assign New Task
          </Button>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogContent className="sm:max-w-[480px] glass-card border-border/30">
              <DialogHeader>
                <DialogTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Assign New Task to QA Member
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateAssignment} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="asgn-title" className="text-xs font-semibold">Task Title *</Label>
                  <Input
                    id="asgn-title"
                    placeholder="e.g. Process Audit at TL#7 Conveyor"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-10 text-xs rounded-xl border-border/30 bg-background/60 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="asgn-desc" className="text-xs font-semibold">Description & Scope *</Label>
                  <Textarea
                    id="asgn-desc"
                    placeholder="Provide specific instructions, items to check, or expected outcome..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    className="text-xs rounded-xl border-border/30 bg-background/60 font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Assign To *</Label>
                    <Select value={assignTo} onValueChange={(val) => setAssignTo(val || 'QA002')}>
                      <SelectTrigger className="h-10 text-xs rounded-xl border-border/30 bg-background/60 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/30">
                        {REPORTING_ENGINEERS.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Priority *</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                      <SelectTrigger className="h-10 text-xs rounded-xl border-border/30 bg-background/60 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/30">
                        <SelectItem value="High">🔴 High</SelectItem>
                        <SelectItem value="Medium">🟡 Medium</SelectItem>
                        <SelectItem value="Low">🟢 Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="asgn-due" className="text-xs font-semibold">Target Completion Date *</Label>
                  <Input
                    id="asgn-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 text-xs rounded-xl border-border/30 bg-background/60 font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenModal(false)}
                    className="rounded-xl border-border/30 font-semibold text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="shimmer-bg text-white font-bold rounded-xl shadow-md shadow-primary/20 text-xs h-9"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                        Assign Task
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/20">
          {[
            { id: 'all', label: 'All Tasks', count: assignments.length },
            { id: 'Assigned', label: 'Assigned', count: assignments.filter((a) => a.status === 'Assigned').length },
            { id: 'In Progress', label: 'In Progress', count: assignments.filter((a) => a.status === 'In Progress').length },
            { id: 'Completed', label: 'Completed', count: assignments.filter((a) => a.status === 'Completed').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label} <span className="opacity-60 text-[10px]">({tab.count})</span>
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchAssignments(true)}
          className="text-xs h-8 text-muted-foreground hover:text-foreground font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Status
        </Button>
      </div>

      {/* Assignments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="glass-card h-48 animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-card glow-card p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold tracking-tight">No Task Assignments Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
            {filterStatus === 'all'
              ? 'No tasks assigned yet. Click "Assign New Task" above to delegate a task to a QA member.'
              : `No tasks found with status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            const isInProgress = task.status === 'In Progress';
            const empName = task.assignee?.name || REPORTING_ENGINEERS.find(e => e.id === task.assigned_to)?.name || task.assigned_to;

            return (
              <div
                key={task.id}
                className={`glass-card glow-card overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                  isCompleted ? 'opacity-85 border-emerald-500/20' : ''
                }`}
              >
                <div>
                  {/* Top Bar Accent */}
                  <div
                    className={`h-1.5 ${
                      task.priority === 'High'
                        ? 'bg-red-500'
                        : task.priority === 'Medium'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />

                  <div className="p-5 space-y-3">
                    {/* Header: Priority & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                          task.priority === 'High'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                            : task.priority === 'Medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {task.priority} Priority
                      </Badge>

                      <Badge
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border-0 ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : isInProgress
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : isInProgress ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {task.status}
                      </Badge>
                    </div>

                    {/* Task Title & Description */}
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-foreground leading-snug">
                        {task.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed line-clamp-3">
                        {task.description}
                      </p>
                    </div>

                    {/* Assignee & Due Date Meta */}
                    <div className="pt-2 border-t border-border/15 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary" /> Assignee:
                        </span>
                        <span className="font-bold text-foreground">{empName}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> Target Date:
                        </span>
                        <span className="font-semibold text-foreground">{formatDate(task.due_date, 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-5 py-3 bg-muted/[0.03] border-t border-border/15 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={task.status}
                      onValueChange={(val) => val && handleStatusChange(task.id, val as AssignedTaskStatus)}
                    >
                      <SelectTrigger className="h-8 text-[11px] font-bold rounded-lg border-border/30 bg-background/80 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/30 text-xs">
                        <SelectItem value="Assigned">Assigned</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTask(task.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete assignment</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
