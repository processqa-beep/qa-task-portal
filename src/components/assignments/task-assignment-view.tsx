'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
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

const INITIAL_ASSIGNMENTS: AssignedTask[] = [
  {
    id: 'asgn-1',
    title: 'Process Audit at TL#7 Conveyor & Tempering Line',
    description: 'Verify SOP display versions behind benteler 7, check oil leakage from conveyor motor, inspect fire hose key.',
    assigned_to: 'QA002',
    assigned_by: 'Chhayank Dave (QA001)',
    due_date: '2026-07-22',
    priority: 'High',
    status: 'In Progress',
    created_at: '2026-07-20T09:00:00Z',
    assignee: REPORTING_ENGINEERS[0],
  },
  {
    id: 'asgn-2',
    title: 'SG#2 Cloud Vision Thickness Dashboard DuckDB Optimization',
    description: 'Move Duckdb data dumping to 219 network PC and add side-by-side glass thickness comparison charts.',
    assigned_to: 'QA004',
    assigned_by: 'Chhayank Dave (QA001)',
    due_date: '2026-07-21',
    priority: 'High',
    status: 'Completed',
    created_at: '2026-07-19T10:30:00Z',
    assignee: REPORTING_ENGINEERS[2],
  },
  {
    id: 'asgn-3',
    title: 'ISO DMS Compliance Verification & Documentation',
    description: 'Verify all 9 Lexcare pending compliance items and update printable PDF standard formats across plant.',
    assigned_to: 'QA003',
    assigned_by: 'Chhayank Dave (QA001)',
    due_date: '2026-07-23',
    priority: 'Medium',
    status: 'Assigned',
    created_at: '2026-07-21T08:00:00Z',
    assignee: REPORTING_ENGINEERS[1],
  },
];

const LOCAL_STORAGE_KEY = 'qa-assigned-tasks-v2';

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

  // Helper to save to localStorage
  const saveToLocal = (tasks: AssignedTask[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  };

  // Helper to read from localStorage
  const readFromLocal = (): AssignedTask[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_ASSIGNMENTS;
  };

  // Fetch assignments globally and merge with localStorage so nothing is lost
  const fetchAssignments = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);

    const localItems = readFromLocal();

    try {
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const data = await res.json();
        if (data.assignments && Array.isArray(data.assignments)) {
          const serverItems: AssignedTask[] = data.assignments;

          // Merge server items & local items seamlessly using a Map on task.id
          const mergedMap = new Map<string, AssignedTask>();
          serverItems.forEach((item) => mergedMap.set(item.id, item));
          localItems.forEach((item) => {
            // Keep local items if not deleted on server
            if (!mergedMap.has(item.id)) {
              mergedMap.set(item.id, item);
            }
          });

          const mergedList = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );

          setAssignments(mergedList);
          saveToLocal(mergedList);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch assignments from API:', err);
    }

    setAssignments(localItems);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const local = readFromLocal();
    setAssignments(local);
    fetchAssignments(true);

    // Poll every 5s for real-time updates across devices
    const interval = setInterval(() => fetchAssignments(false), 5000);
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

    // 1. Immediately update state & save to local storage (sub-ms instant speed)
    const updated = [newTask, ...assignments];
    setAssignments(updated);
    saveToLocal(updated);

    toast.success(`Task assigned to ${assigneeObj?.name || assignTo}!`);
    setNewTitle('');
    setNewDesc('');
    setOpenModal(false);
    setIsSubmitting(false);

    // 2. Sync asynchronously with backend API
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
    } catch {
      // ignore
    }
  };

  const handleStatusChange = async (id: string, newStatus: AssignedTaskStatus) => {
    const updated = assignments.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    setAssignments(updated);
    saveToLocal(updated);
    toast.success(`Status updated to ${newStatus}`);

    try {
      await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch {
      // ignore
    }
  };

  const handleDeleteTask = async (id: string) => {
    const updated = assignments.filter((a) => a.id !== id);
    setAssignments(updated);
    saveToLocal(updated);
    toast.success('Task assignment deleted');

    try {
      await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  };

  const handleDeleteCompleted = async () => {
    const completedCount = assignments.filter((a) => a.status === 'Completed').length;
    if (completedCount === 0) {
      toast.info('No completed tasks to delete');
      return;
    }

    const updated = assignments.filter((a) => a.status !== 'Completed');
    setAssignments(updated);
    saveToLocal(updated);
    toast.success(`Deleted ${completedCount} completed task(s)`);

    try {
      await fetch('/api/assignments?deleteAllOld=true', { method: 'DELETE' });
    } catch {
      // ignore
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
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
            Assign tasks to QA members and track progress in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAssignments(true)}
            className="h-9 rounded-xl border-border/30 hover:bg-primary/5 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-xl font-bold text-xs h-9 px-4 py-2 shimmer-bg text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer">
              <PlusCircle className="h-4 w-4 mr-2" />
              Assign New Task
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass-card border-border/30">
              <DialogHeader>
                <DialogTitle className="text-base font-bold tracking-tight">Assign Task to QA Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Assign To QA Member *</Label>
                  <Select value={assignTo} onValueChange={(val) => val && setAssignTo(val)}>
                    <SelectTrigger className="h-10 rounded-xl border-border/30 bg-background/60 font-medium">
                      <SelectValue placeholder="Select QA Member" />
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
                  <Label className="text-xs font-semibold">Task Title *</Label>
                  <Input
                    placeholder="e.g. Process Audit at SG#3.1 Line"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-10 rounded-xl border-border/30 bg-background/60 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Description & Instructions *</Label>
                  <Textarea
                    placeholder="Detailed instructions for the task..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    className="resize-none rounded-xl border-border/30 bg-background/60 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Due Date *</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-10 rounded-xl border-border/30 bg-background/60 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Priority *</Label>
                    <Select value={priority} onValueChange={(val) => val && setPriority(val as TaskPriority)}>
                      <SelectTrigger className="h-10 rounded-xl border-border/30 bg-background/60 font-medium">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/30">
                        <SelectItem value="High">🔴 High</SelectItem>
                        <SelectItem value="Medium">🟡 Medium</SelectItem>
                        <SelectItem value="Low">🟢 Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl border-border/30 font-semibold">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="shimmer-bg text-white font-bold rounded-xl shadow-md shadow-primary/20">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign Task'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Engineer Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {REPORTING_ENGINEERS.map((emp) => {
          const empAssigned = assignments.filter((a) => a.assigned_to === emp.id || a.assignee?.name === emp.name);
          const pendingCount = empAssigned.filter((a) => a.status !== 'Completed').length;
          const completedCount = empAssigned.filter((a) => a.status === 'Completed').length;

          return (
            <div key={emp.id} className="glass-card glow-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl shimmer-bg flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-primary/10">
                    {emp.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-tight leading-tight">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{emp.id}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-lg border-border/30">
                  {empAssigned.length} Tasks
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {pendingCount} Pending / In Progress
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {completedCount} Completed
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Assignments List */}
      <div className="glass-card glow-card overflow-hidden">
        <div className="p-5 pb-3 border-b border-border/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight">Assigned Task List</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Real-time status tracking for all assigned work</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/20">
                {['all', 'Assigned', 'In Progress', 'Completed'].map((st) => (
                  <Button
                    key={st}
                    variant={filterStatus === st ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterStatus(st)}
                    className={`text-[11px] h-7 px-2.5 rounded-lg font-bold ${
                      filterStatus === st ? 'shimmer-bg text-white shadow-sm' : 'hover:bg-primary/5'
                    }`}
                  >
                    {st === 'all' ? `All (${assignments.length})` : st}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteCompleted}
                className="text-xs h-8 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 border-red-500/20 font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear Completed
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5">
          {isLoading && assignments.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
              <p className="text-xs text-muted-foreground font-medium">Loading assignments...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">No assigned tasks matching status filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const assigneeName = REPORTING_ENGINEERS.find((e) => e.id === task.assigned_to)?.name || task.assigned_to;

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-border/20 hover:border-primary/20 transition-all bg-background/30 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={
                            task.priority === 'High'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-0 text-[9px] font-bold rounded-lg'
                              : task.priority === 'Medium'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[9px] font-bold rounded-lg'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-bold rounded-lg'
                          }
                        >
                          {task.priority} Priority
                        </Badge>
                        <h3 className="font-bold text-xs tracking-tight">{task.title}</h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className={
                            task.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-bold rounded-lg'
                              : task.status === 'In Progress'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-[9px] font-bold rounded-lg'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[9px] font-bold rounded-lg'
                          }
                        >
                          {task.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {task.status === 'In Progress' && <Clock className="h-3 w-3 mr-1 text-blue-500" />}
                          {task.status === 'Assigned' && <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />}
                          {task.status}
                        </Badge>

                        {/* Status Change Dropdown */}
                        <Select
                          value={task.status}
                          onValueChange={(val) => val && handleStatusChange(task.id, val as AssignedTaskStatus)}
                        >
                          <SelectTrigger className="h-7 text-xs w-[120px] rounded-lg border-border/30 bg-background/60 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-border/30">
                            <SelectItem value="Assigned">Assigned</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Delete Task Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">{task.description}</p>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/15 text-[10px] text-muted-foreground gap-2 font-medium">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" />
                          Assigned to: <strong className="text-foreground font-bold">{assigneeName} ({task.assigned_to})</strong>
                        </span>
                        <span>Assigned by: {task.assigned_by}</span>
                      </div>
                      <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold">
                        <Calendar className="h-3 w-3" />
                        Due: {formatDate(task.due_date, 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
