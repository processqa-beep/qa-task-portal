'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { ClipboardList, PlusCircle, CheckCircle2, Clock, AlertCircle, User, Calendar, Tag } from 'lucide-react';
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

export function TaskAssignmentView() {
  const { employee } = useAuth();
  const [assignments, setAssignments] = useState<AssignedTask[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [assignTo, setAssignTo] = useState('QA002');
  const [dueDate, setDueDate] = useState(getToday());
  const [priority, setPriority] = useState<TaskPriority>('High');

  useEffect(() => {
    const stored = localStorage.getItem('qa-assigned-tasks');
    if (stored) {
      try {
        setAssignments(JSON.parse(stored));
      } catch {
        setAssignments(INITIAL_ASSIGNMENTS);
      }
    } else {
      setAssignments(INITIAL_ASSIGNMENTS);
      localStorage.setItem('qa-assigned-tasks', JSON.stringify(INITIAL_ASSIGNMENTS));
    }
  }, []);

  const saveAssignments = (data: AssignedTask[]) => {
    setAssignments(data);
    localStorage.setItem('qa-assigned-tasks', JSON.stringify(data));
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error('Please enter task title and description');
      return;
    }

    const assigneeObj = REPORTING_ENGINEERS.find(e => e.id === assignTo);

    const newTask: AssignedTask = {
      id: `asgn-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      assigned_to: assignTo,
      assigned_by: employee?.name ? `${employee.name} (${employee.id})` : 'Chhayank Dave (QA001)',
      due_date: dueDate,
      priority,
      status: 'Assigned',
      created_at: new Date().toISOString(),
      assignee: assigneeObj,
    };

    const updated = [newTask, ...assignments];
    saveAssignments(updated);
    toast.success(`Task assigned to ${assigneeObj?.name || assignTo}!`);

    setNewTitle('');
    setNewDesc('');
    setOpenModal(false);
  };

  const handleStatusChange = (id: string, newStatus: AssignedTaskStatus) => {
    const updated = assignments.map(a => a.id === id ? { ...a, status: newStatus } : a);
    saveAssignments(updated);
    toast.success(`Task status updated to ${newStatus}`);
  };

  const filteredTasks = assignments.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-violet-500" />
            Assign & Track Tasks
          </h1>
          <p className="text-sm text-muted-foreground">Assign tasks to the 3 QA members and track progress in real-time</p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md font-medium text-xs h-9 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 transition-all">
            <PlusCircle className="h-4 w-4 mr-2" />
            Assign New Task
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-lg">Assign Task to QA Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAssignment} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Assign To QA Member *</Label>
                <Select value={assignTo} onValueChange={(val) => val && setAssignTo(val)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select QA Member" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORTING_ENGINEERS.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Task Title *</Label>
                <Input
                  placeholder="e.g. Process Audit at SG#3.1 Line"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Description & Instructions *</Label>
                <Textarea
                  placeholder="Detailed instructions for the task..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Due Date *</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Priority *</Label>
                  <Select value={priority} onValueChange={(val) => val && setPriority(val as TaskPriority)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">🔴 High</SelectItem>
                      <SelectItem value="Medium">🟡 Medium</SelectItem>
                      <SelectItem value="Low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                  Assign Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Engineer Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {REPORTING_ENGINEERS.map(emp => {
          const empAssigned = assignments.filter(a => a.assigned_to === emp.id || a.assignee?.name === emp.name);
          const pendingCount = empAssigned.filter(a => a.status !== 'Completed').length;
          const completedCount = empAssigned.filter(a => a.status === 'Completed').length;

          return (
            <Card key={emp.id} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.id}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {empAssigned.length} Tasks
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {pendingCount} Pending / In Progress
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {completedCount} Completed
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter & Assignments List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Assigned Task List</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="text-xs h-8"
              >
                All ({assignments.length})
              </Button>
              <Button
                variant={filterStatus === 'Assigned' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('Assigned')}
                className="text-xs h-8"
              >
                Assigned
              </Button>
              <Button
                variant={filterStatus === 'In Progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('In Progress')}
                className="text-xs h-8"
              >
                In Progress
              </Button>
              <Button
                variant={filterStatus === 'Completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('Completed')}
                className="text-xs h-8"
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No assigned tasks matching status</p>
            ) : (
              filteredTasks.map((task) => {
                const assigneeName = REPORTING_ENGINEERS.find(e => e.id === task.assigned_to)?.name || task.assigned_to;

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-border/50 hover:border-violet-500/30 transition-all bg-card/60 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            task.priority === 'High'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-0 text-[10px]'
                              : task.priority === 'Medium'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[10px]'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]'
                          }
                        >
                          {task.priority} Priority
                        </Badge>
                        <h3 className="font-semibold text-sm">{task.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            task.status === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]'
                              : task.status === 'In Progress'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-[10px]'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[10px]'
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
                          <SelectTrigger className="h-7 text-xs w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Assigned">Assigned</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/30 text-[11px] text-muted-foreground gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-violet-500" />
                          Assigned to: <strong className="text-foreground">{assigneeName} ({task.assigned_to})</strong>
                        </span>
                        <span>Assigned by: {task.assigned_by}</span>
                      </div>
                      <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-medium">
                        <Calendar className="h-3 w-3" />
                        Due: {formatDate(task.due_date, 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
