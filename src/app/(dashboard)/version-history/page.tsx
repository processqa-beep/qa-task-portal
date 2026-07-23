'use client';

import { Badge } from '@/components/ui/badge';
import { GitBranch, Star, Shield, Zap, Sparkles } from 'lucide-react';

interface VersionInfo {
  version: string;
  date: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  changes: string[];
}

const VERSIONS: VersionInfo[] = [
  {
    version: 'v2.0.0',
    date: 'July 22, 2026',
    badge: 'Latest Release',
    badgeColor: 'bg-primary/8 text-primary border-primary/15',
    icon: Sparkles,
    iconColor: 'bg-primary/10 text-primary border-primary/20',
    title: 'Premium UI Overhaul & Today\'s Report Table',
    changes: [
      'Complete UI redesign with glassmorphism card system — every card now uses frosted glass with backdrop blur, layered shadows, and gradient glow borders on hover.',
      'Switched global font to Inter (300–900 weights) for sharper, more legible typography across all screen sizes.',
      'Built animated shimmer gradient backgrounds for hero banners, buttons, and avatar initials with smooth 8-second color shifts.',
      'Added ambient floating glow orbs on login and dashboard backgrounds using the primary color palette for visual depth.',
      'Redesigned Today\'s Report Summary into a full detail table with Sr No, QA Member, Work Type, Task Performed, and Status columns — showing all 3 members with their actual submitted report data.',
      'Members with multiple daily tasks now get separate rows; members who haven\'t submitted show an amber "Not submitted yet" warning row.',
      'Added pulse-ring animation on notification bell and live status indicators for a polished interactive feel.',
      'Upgraded color palette from neutral grayscale to a violet-tinted oklch system — all borders, backgrounds, and muted tones carry a warm purple tint.',
      'Removed the dashboard hero welcome banner for a cleaner, data-first layout.',
      'Refined dark mode with deeper card backgrounds, brighter accent colors, and consistent glass effects.',
    ],
  },
  {
    version: 'v1.3.0',
    date: 'July 22, 2026',
    badge: 'Stable',
    badgeColor: 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/15',
    icon: Zap,
    iconColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    title: 'QA Member-wise Analytics & Premium UI Enhancements',
    changes: [
      'Added QA Member-wise Analytics tab to track individual performance metrics (Total tasks, Completed, Pending, Rate).',
      'Created individual work type distribution bar charts and weekly activity trends.',
      'Designed a colorful, non-messy, responsive Task Table layout with soft row borders and distinct category badges.',
      'Configured employee dropdown fields so daily task reports are submitted for any of the 3 reporting QA Engineers.',
      'Added visual Gold, Silver, and Bronze trophy indicator rankings to the Performance Leaderboard.',
    ],
  },
  {
    version: 'v1.2.0',
    date: 'July 21, 2026',
    badge: 'Previous',
    badgeColor: 'bg-slate-500/8 text-slate-600 dark:text-slate-400 border-slate-500/15',
    icon: Zap,
    iconColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    title: 'Task Assignment Module & Live Notifications',
    changes: [
      'Launched Assign Tasks module allowing the Team Leader to assign specific tasks with High, Medium, or Low priorities.',
      'Created live assignment cards showing due dates, assignee metadata, and progress status tracking.',
      'Activated the top header Notification Bell dropdown with unread badge updates and Clear All actions.',
      'Integrated direct browser Supabase connections to drop page navigation latencies down to less than 10 milliseconds.',
    ],
  },
  {
    version: 'v1.1.0',
    date: 'July 20, 2026',
    badge: 'Previous',
    badgeColor: 'bg-slate-500/8 text-slate-600 dark:text-slate-400 border-slate-500/15',
    icon: Shield,
    iconColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    title: 'Real-time WebSocket Sync & Multi-task Support',
    changes: [
      'Dropped UNIQUE(employee_id, date) constraints to allow engineers to submit multiple distinct task reports per day.',
      'Configured Supabase Realtime WebSocket client subscriptions so task tables update live as entries are saved.',
      'Updated next.config.ts allowedDevOrigins to support local network IP connections without blocking assets.',
      'Implemented system theme provider with custom scrollbars and light/dark toggles.',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'July 18, 2026',
    badge: 'Initial Release',
    badgeColor: 'bg-slate-500/8 text-slate-600 dark:text-slate-400 border-slate-500/15',
    icon: Star,
    iconColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    title: 'Portal Core & Daily Report Form Launch',
    changes: [
      'Built core Employee ID and PIN authentication gateway supporting custom user roles.',
      'Created standard Daily Report form with auto-save draft functionality (localStorage debounce).',
      'Designed mobile-first bottom tabs and collapsible side navigation structures.',
      'Connected Supabase tables with Row Level Security (RLS) policies.',
    ],
  },
];

export default function VersionHistoryPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          Version History
        </h1>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Portal update timeline and feature changelog</p>
      </div>

      <div className="relative border-l-2 border-border/20 pl-7 ml-4 space-y-8 py-2">
        {VERSIONS.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={item.version} className="relative space-y-3">
              {/* Timeline marker */}
              <div className={`absolute -left-[37px] top-1 h-7 w-7 rounded-full border-2 flex items-center justify-center bg-background shadow-sm ${item.iconColor}`}>
                <IconComponent className="h-3.5 w-3.5" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-black tracking-tight">{item.version}</span>
                <span className="text-[11px] text-muted-foreground font-medium">({item.date})</span>
                <Badge variant="outline" className={`text-[9px] uppercase font-bold px-2 py-0 h-5 rounded-lg ${item.badgeColor}`}>
                  {item.badge}
                </Badge>
              </div>

              <div className="glass-card glow-card p-5 space-y-3">
                <h3 className="text-sm font-bold tracking-tight">{item.title}</h3>
                <ul className="list-none pl-0 space-y-2">
                  {item.changes.map((change, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-muted-foreground leading-relaxed font-medium hover:text-foreground transition-colors duration-200">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
