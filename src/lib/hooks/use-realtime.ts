'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch direct from Supabase in browser for max speed
      const [empRes, tasksRes] = await Promise.all([
        supabase.from('employees').select('*').order('id'),
        supabase.from('daily_tasks').select('*').order('date', { ascending: false }),
      ]);

      let empList: Employee[] = empRes.data || [];
      let rawTasks = tasksRes.data || [];

      // If browser direct query is empty/failed, fallback to API routes
      if (empList.length === 0 || rawTasks.length === 0) {
        const [apiTasks, apiEmps] = await Promise.all([
          fetch(`/api/tasks${!isLeader && userEmployeeId ? `?employee_id=${userEmployeeId}` : ''}`).then(r => r.json()),
          fetch('/api/employees').then(r => r.json()),
        ]);
        if (apiEmps.employees) empList = apiEmps.employees;
        if (apiTasks.tasks) rawTasks = apiTasks.tasks;
      }

      // Attach employee metadata to each task
      const fullTasks: DailyTask[] = rawTasks.map((t) => {
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

      globalEmployeesCache = empList;
      globalTasksCache = fullTasks;

      setEmployees(empList);
      setTasks(fullTasks);
    } catch (err) {
      console.error('Failed to load realtime data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userEmployeeId, isLeader, supabase]);

  useEffect(() => {
    loadData();

    // Supabase Realtime WebSocket subscription
    const tasksChannel = supabase
      .channel('realtime_daily_tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' }, () => {
        loadData();
      })
      .subscribe();

    const employeesChannel = supabase
      .channel('realtime_employees_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(employeesChannel);
    };
  }, [loadData, supabase]);

  return { tasks, employees, isLoading, refresh: loadData };
}
