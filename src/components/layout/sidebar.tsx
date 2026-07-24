'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { NAV_ITEMS } from '@/lib/constants';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Users,
  BarChart3,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  TrendingUp,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  PlusCircle,
  History,
  ClipboardList,
  Users,
  BarChart3,
  GitBranch,
  TrendingUp,
  Info,
};

export function Sidebar() {
  const pathname = usePathname();
  const { employee, isLeader, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(true);

  const filteredItems = NAV_ITEMS.filter(
    (item) => item.roles.includes(employee?.role || 'employee')
  );

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 border-r border-border/30 bg-card/40 backdrop-blur-2xl transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[250px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border/30">
        <div className={cn(
          'flex items-center gap-2.5 overflow-hidden transition-all duration-300',
          collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
        )}>
          <div className="h-9 w-9 rounded-xl shimmer-bg flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
            <span className="text-white font-black text-sm">QA</span>
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight whitespace-nowrap">Task Portal</span>
            <p className="text-[10px] text-muted-foreground font-medium">v2.0 Premium</p>
          </div>
        </div>
        {collapsed && (
          <div className="h-9 w-9 rounded-xl shimmer-bg flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20 mx-auto">
            <span className="text-white font-black text-sm">QA</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {filteredItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] flex-shrink-0', isActive && 'text-primary')} />
              <span className={cn(
                'whitespace-nowrap transition-all duration-300',
                collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      <Separator className="opacity-30" />

      {/* User section */}
      <div className="p-3">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2',
          collapsed && 'justify-center px-0'
        )}>
          <div className="h-8 w-8 rounded-xl shimmer-bg flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/15">
            <span className="text-white text-[10px] font-bold">
              {employee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>
            <p className="text-sm font-semibold truncate">{employee?.name}</p>
            <p className="text-[11px] text-muted-foreground capitalize font-medium">{employee?.role}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            'w-full text-muted-foreground hover:text-red-500 hover:bg-red-500/8 transition-all rounded-xl',
            collapsed ? 'px-2' : 'justify-start'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className={cn(
            'ml-2 transition-all duration-300',
            collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
          )}>
            Logout
          </span>
        </Button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-20 h-7 w-7 rounded-full border border-border/40 bg-card flex items-center justify-center hover:bg-primary/5 hover:border-primary/20 transition-all shadow-lg shadow-black/5"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
