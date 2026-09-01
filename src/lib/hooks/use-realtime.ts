'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DailyTask, Employee } from '@/lib/types';

const ID_NAME_MAP: Record<string, string> = {
  QA001: 'Chhayank Dave',
  QA002: 'Hiren Dodiya',
  QA003: 'Purvesh Kapadiya',
  QA004: 'Mehul Chikhaliya',
  'Chhayank Dave': 'QA001',
  'Hiren Dodiya': 'QA002',
  'Purvesh Kapadiya': 'QA003',
  'Mehul Chikhaliya': 'QA004',
};

// Global in-memory cache for instant zero-delay page transitions
let globalTasksCache: DailyTask[] = [];
let globalEmployeesCache: Employee[] = [];

export function useRealtimeData(userEmployeeId?: string, isLeader?: boolean) {
  const [tasks, setTasks] = useState<DailyTask[]>(globalTasksCache);
  const [employees, setEmployees] = useState<Employee[]>(globalEmployeesCache);
  const [isLoading, setIsLoading] = useState(globalTasksCache.length === 0);

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      // 1. Fetch direct from Supabase in browser for max speed
      const [empRes, tasksRes] = await Promise.all([
        supabase.from('employees').select('*').order('id'),
        supabase.from('daily_tasks').select('*').order('date', { ascending: false }),
      ]).catch(() => [ { data: null }, { data: null } ]);

      let empList: Employee[] = empRes.data || [];
      let rawTasks = tasksRes.data || [];

      // If browser direct query is empty/failed, fallback to API routes
      if (empList.length === 0 || rawTasks.length === 0) {
        try {
          const [apiTasks, apiEmps] = await Promise.all([
            fetch(`/api/tasks${!isLeader && userEmployeeId ? `?employee_id=${userEmployeeId}` : ''}`).then(r => r.ok ? r.json() : { tasks: [] }),
            fetch('/api/employees').then(r => r.ok ? r.json() : { employees: [] }),
          ]);
          if (apiEmps?.employees?.length > 0) empList = apiEmps.employees;
          if (apiTasks?.tasks?.length > 0) rawTasks = apiTasks.tasks;
        } catch {
          // ignore
        }
      }

      // Attach employee metadata to each task (filtering out task assignment records)
      const cleanRawTasks = rawTasks.filter(
        (t: any) => !t.task_performed?.startsWith('[TASK_ASSIGNMENT]')
      );

      const fullTasks: DailyTask[] = cleanRawTasks.map((t: any) => {
        const emp = empList.find(e => e.id === t.employee_id || e.name === t.employee_id) || {
          id: ID_NAME_MAP[t.employee_id] || t.employee_id,
          name: t.employee_id,
          role: 'employee',
          pin: '1234',
          created_at: '',
        };
        return {
          ...t,
          employee: emp,
        };
      });

      if (empList.length > 0) globalEmployeesCache = empList;
      if (fullTasks.length > 0) globalTasksCache = fullTasks;

      setEmployees(empList.length > 0 ? empList : globalEmployeesCache);
      setTasks(fullTasks.length > 0 ? fullTasks : globalTasksCache);
    } catch (err) {
      console.warn('Realtime data fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userEmployeeId, isLeader]);

  useEffect(() => {
    loadData();

    if (typeof window === 'undefined') return;

    const supabase = createClient();
    const instanceId = Math.random().toString(36).substring(2, 7);

    let tasksChannel: any = null;
    let employeesChannel: any = null;

    try {
      tasksChannel = supabase
        .channel(`rt_tasks_${instanceId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' }, () => {
          loadData();
        })
        .subscribe();

      employeesChannel = supabase
        .channel(`rt_emps_${instanceId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
          loadData();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }

    return () => {
      try {
        if (tasksChannel) supabase.removeChannel(tasksChannel);
        if (employeesChannel) supabase.removeChannel(employeesChannel);
      } catch {
        // ignore
      }
    };
  }, [loadData]);

  return { tasks, employees, isLoading, refresh: loadData };
}
