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
  GitBranch,
  TrendingUp,
  Info,
} from 'lucide-react';

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

export function MobileNav() {
  const pathname = usePathname();
  const { employee } = useAuth();

  const filteredItems = NAV_ITEMS.filter(
    (item) => item.roles.includes(employee?.role || 'employee')
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/20 bg-background/80 backdrop-blur-2xl">
      <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
        {filteredItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-all duration-200',
                isActive && 'bg-primary/10 shadow-sm shadow-primary/10'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[9px] font-bold tracking-tight">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
