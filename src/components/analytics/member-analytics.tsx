'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyTask, Employee, WorkType } from '@/lib/types';
import { WORK_TYPE_COLORS } from '@/lib/constants';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { User, Calendar, CheckCircle2, Clock, Award, Star, Flame } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface MemberAnalyticsProps {
  tasks: DailyTask[];
  employees: Employee[];
}

export function MemberAnalytics({ tasks, employees }: MemberAnalyticsProps) {
  const reportingQA = useMemo(() => {
    return employees.filter(e => e.id !== 'QA001'); // Filter out Chhayank Dave (leader)
  }, [employees]);

  const [selectedEmpId, setSelectedEmpId] = useState<string>(reportingQA[0]?.id || 'QA002');

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId);
  }, [employees, selectedEmpId]);

  const memberTasks = useMemo(() => {
    return tasks.filter(t => t.employee_id === selectedEmpId || t.employee?.name === selectedEmployee?.name);
  }, [tasks, selectedEmpId, selectedEmployee]);

  const stats = useMemo(() => {
    const total = memberTasks.length;
    const completed = memberTasks.filter(t => t.status === 'Completed').length;
    const pending = memberTasks.filter(t => t.status === 'Pending').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, rate };
  }, [memberTasks]);

  // Work Type distribution for selected member
  const workTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    memberTasks.forEach((t) => {
      counts[t.work_type] = (counts[t.work_type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [memberTasks]);

  // Daily trend data for selected member (last 10 entries)
  const dailyData = useMemo(() => {
    const sorted = [...memberTasks]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);

    const counts: Record<string, number> = {};
    sorted.forEach(t => {
      counts[t.date] = (counts[t.date] || 0) + 1;
    });

    return Object.entries(counts).map(([date, count]) => ({
      date: formatDate(date, 'MMM dd'),
      count,
    }));
  }, [memberTasks]);

  return (
    <div className="space-y-6">
      {/* Selector and Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Picker */}
        <Card className="lg:col-span-1 border-0 shadow-lg shadow-violet-500/5 bg-background/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-violet-500" />
              Select QA Engineer
            </CardTitle>
            <CardDescription>View detailed metrics for a specific member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportingQA.map((emp) => {
              const active = emp.id === selectedEmpId;
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    active
                      ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-500/30 text-foreground'
                      : 'bg-muted/30 border-transparent hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    active ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-muted-foreground/30 text-foreground'
                  }`}>
                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground/75 mt-0.5">{emp.id}</p>
                  </div>
                  {active && <Star className="h-4 w-4 text-amber-500 shrink-0 fill-amber-500" />}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: Profile Stats Card */}
        {selectedEmployee && (
          <Card className="lg:col-span-2 border-0 shadow-lg shadow-violet-500/5 bg-background/60 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-2xl" />
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  {selectedEmployee.name} Performance Profile
                </CardTitle>
                <CardDescription>Metrics aggregate across {stats.total} total daily reports</CardDescription>
              </div>
              <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-semibold">{selectedEmployee.id}</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/20 text-center space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Reports</span>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center space-y-1">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Completed</span>
                <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center space-y-1">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold">Pending</span>
                <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-violet-500/5 border border-violet-500/10 text-center space-y-1">
                <span className="text-[10px] text-violet-600 dark:text-violet-400 uppercase font-semibold">Completion Rate</span>
                <p className="text-2xl font-bold text-violet-500">{stats.rate}%</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Member charts and reports */}
      {selectedEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Distribution Chart */}
          <Card className="border-0 shadow-lg shadow-violet-500/5 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Work Type Distribution</CardTitle>
              <CardDescription>Breakdown of task types for {selectedEmployee.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {workTypeData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No reports recorded</div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workTypeData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} style={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                        {workTypeData.map((entry, index) => {
                          const color = WORK_TYPE_COLORS[entry.name as WorkType] || 'hsl(220, 15%, 55%)';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Trend Chart */}
          <Card className="border-0 shadow-lg shadow-violet-500/5 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Submission Frequency</CardTitle>
              <CardDescription>Daily task count submitted over time</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No reports recorded</div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <XAxis dataKey="date" style={{ fontSize: 10 }} tickLine={false} />
                      <YAxis style={{ fontSize: 10 }} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                      <Line type="monotone" dataKey="count" stroke="hsl(262, 83%, 58%)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Member Activity List */}
      {selectedEmployee && (
        <Card className="border-0 shadow-lg shadow-violet-500/5 bg-background/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Activity logs for {selectedEmployee.name}</CardTitle>
            <CardDescription>List of daily task details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No tasks logged</p>
            ) : (
              memberTasks.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl border border-border/40 bg-card hover:border-violet-500/20 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-semibold">{t.work_type}</Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(t.date, 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/95 leading-relaxed">{t.task_performed}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={t.status === 'Completed'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-medium'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[9px] font-medium'
                      }
                    >
                      {t.status === 'Completed' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {t.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
