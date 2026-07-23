'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Bell, LogOut, CheckCheck, Info, CheckCircle2 } from 'lucide-react';
import { getGreeting, getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  type: 'task' | 'system' | 'info';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'Hiren Dodiya submitted today\'s report for Process Audit & IMS', time: '10 mins ago', unread: true, type: 'task' },
  { id: '2', title: 'Mehul Chikhaliya updated SG#2 Cloud Vision Dashboard', time: '1 hour ago', unread: true, type: 'task' },
  { id: '3', title: 'Purvesh Kapadiya active on daily task tracking', time: '2 hours ago', unread: false, type: 'info' },
  { id: '4', title: 'Daily Report backup synced to Supabase Cloud', time: 'Today 09:00 AM', unread: false, type: 'system' },
];

export function Header() {
  const { employee, isLeader, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
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

          {/* Interactive Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-9 w-9 rounded-xl flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer outline-none">
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-primary pulse-ring" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 space-y-1 glass-card border-border/30">
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold tracking-tight">Notifications</p>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0 font-semibold">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              <DropdownMenuSeparator />

              <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs flex items-start gap-2.5 transition-all duration-200 ${
                      n.unread ? 'bg-primary/[0.06]' : 'hover:bg-muted/40'
                    }`}
                  >
                    {n.type === 'task' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground leading-tight">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
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
