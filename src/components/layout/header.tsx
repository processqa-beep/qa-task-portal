'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Bell, LogOut, CheckCheck, Info, CheckCircle2, Trash2 } from 'lucide-react';
import { getGreeting, getInitials, formatDate } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRealtimeData } from '@/lib/hooks/use-realtime';

interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  unread: boolean;
  type: 'task' | 'system' | 'info';
}

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

export function Header() {
  const { employee, isLeader, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { tasks } = useRealtimeData(employee?.id, isLeader);

  const [readIds, setReadIds] = useState<string[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);

  // Load read and cleared notification states from localStorage
  useEffect(() => {
    try {
      const savedRead = localStorage.getItem('qa-notifications-read');
      if (savedRead) setReadIds(JSON.parse(savedRead));

      const savedCleared = localStorage.getItem('qa-notifications-cleared');
      if (savedCleared) setClearedIds(JSON.parse(savedCleared));
    } catch {
      // ignore
    }
  }, []);

  // Dynamically generate real notifications from real submitted tasks
  const notifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    // Sort tasks by date & id descending so newest task reports are on top
    const sortedTasks = [...tasks].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date).getTime();
      const timeB = new Date(b.created_at || b.date).getTime();
      return timeB - timeA;
    });

    // 1. Task submission notifications from real task data
    sortedTasks.forEach((t) => {
      const notifId = `task-${t.id}`;
      if (clearedIds.includes(notifId)) return;

      const rawEmp = t.employee_id || t.employee?.id || 'QA004';
      const empName = t.employee?.name || ID_NAME_MAP[rawEmp] || rawEmp;
      const empId = ID_NAME_MAP[empName] || rawEmp;

      const previewText = t.task_performed
        ? t.task_performed.length > 55
          ? t.task_performed.slice(0, 55) + '...'
          : t.task_performed
        : 'Submitted daily report';

      list.push({
        id: notifId,
        title: `${empName} (${empId}) submitted ${t.work_type} task`,
        subtitle: previewText,
        time: formatDate(t.created_at || t.date, 'MMM dd, yyyy · hh:mm a'),
        unread: !readIds.includes(notifId),
        type: 'task',
      });
    });

    // 2. System backup status notification
    if (!clearedIds.includes('sys-1')) {
      list.push({
        id: 'sys-1',
        title: 'Daily Report Backup Synced',
        subtitle: 'All QA task submissions synchronized to Supabase Cloud Storage',
        time: 'Active System Sync',
        unread: !readIds.includes('sys-1'),
        type: 'system',
      });
    }

    return list.slice(0, 15);
  }, [tasks, readIds, clearedIds]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem('qa-notifications-read', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map((n) => n.id);
    const updatedCleared = Array.from(new Set([...clearedIds, ...allIds]));
    setClearedIds(updatedCleared);
    try {
      localStorage.setItem('qa-notifications-cleared', JSON.stringify(updatedCleared));
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border/40 bg-background/70 backdrop-blur-2xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Greeting */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden h-9 w-9 rounded-xl shimmer-bg flex items-center justify-center shadow-md shadow-primary/20">
            <span className="text-white font-black text-xs">QA</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">
              {getGreeting()}, <span className="text-primary">{employee?.name?.split(' ')[0]}</span>
            </p>
            <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">
              {isLeader ? 'Team Leader Dashboard' : 'QA Member Dashboard'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 rounded-xl hover:bg-primary/5 transition-colors"
          >
            <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Interactive Dynamic Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-9 w-9 rounded-xl flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer outline-none">
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-primary pulse-ring" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-2 space-y-1 glass-card border-border/30">
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold tracking-tight">Live Notifications</p>
                  {unreadCount > 0 ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0 font-bold">
                      {unreadCount} new
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground border-border/30 font-medium">
                      Up to date
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <CheckCheck className="h-3 w-3" /> Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-muted-foreground hover:text-red-500 hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              <DropdownMenuSeparator />

              <div className="max-h-72 overflow-y-auto space-y-1.5 py-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <Bell className="h-5 w-5 mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs font-medium">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl text-xs flex items-start gap-2.5 transition-all duration-200 border ${
                        n.unread
                          ? 'bg-primary/[0.06] border-primary/15'
                          : 'bg-background/40 border-border/10 hover:bg-muted/40'
                      }`}
                    >
                      {n.type === 'task' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      ) : (
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground leading-snug">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal line-clamp-2">{n.subtitle}</p>
                        <p className="text-[9px] text-primary/70 font-semibold mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer outline-none ml-1">
              <div className="h-8 w-8 rounded-xl shimmer-bg flex items-center justify-center shadow-md shadow-primary/15">
                <span className="text-white text-[11px] font-bold">
                  {employee?.name ? getInitials(employee.name) : '?'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-none tracking-tight">{employee?.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium bg-primary/5 text-primary border-0">
                    {employee?.id}
                  </Badge>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card border-border/30">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold">{employee?.name}</p>
                <p className="text-xs text-muted-foreground">{employee?.id} · {employee?.role}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
