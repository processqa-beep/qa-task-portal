'use client';

import { Badge } from '@/components/ui/badge';
import { GitBranch, Star, Shield, Zap, Sparkles, Code2, UserCheck, Layers, MessageSquare, CheckCircle2, Info } from 'lucide-react';

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
    version: 'v2.2.0',
    date: 'July 24, 2026',
    badge: 'Latest Release',
    badgeColor: 'bg-primary/10 text-primary border-primary/20 font-bold',
    icon: Sparkles,
    iconColor: 'bg-primary/10 text-primary border-primary/20',
    title: 'Google Chat Integration, Task History Deletion & Assignment Sync',
    changes: [
      'Integrated Google Chat Webhook Cards with server API (/api/google-chat) to bypass browser CORS restrictions and format messages.',
      'Created Date & QA Member Selector Modal allowing users to post daily activity summary cards for any specific date and any member (or all team members).',
      'Formatted Google Chat cards with colorful work type tags (e.g. 1. DEVLOPMENT: Task details...), bold member names in header title, and clean text layout.',
      'Added Task Delete option (Trash2 icon) with confirmation modal in the Task History table and mobile card views.',
      'Built dual-layer (localStorage + server API) permanent persistence for Task Assignments so assigned tasks never disappear on page refresh.',
      'Added "Clear Completed Tasks" bulk cleanup action in Task Assignments view.',
      'Added Developer Profile header and updated About navigation section.',
    ],
  },
  {
    version: 'v2.1.0',
    date: 'July 23, 2026',
    badge: 'Stable',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold',
    icon: Shield,
    iconColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    title: 'Process Impact Review Dashboard',
    changes: [
      'Built Impact Review page featuring KPI cards for total, critical, and high-impact QA activities.',
      'Added 5 interactive charts: Impact by Category, Impact Level Breakdown, QA Member Contribution, Category Coverage Radar, and Timeline Trend.',
      'Added data labels on all bar, area, and line charts with plain-language chart explanations.',
      'Created filterable Detail Table with category badges and level indicators.',
    ],
  },
  {
    version: 'v2.0.0',
    date: 'July 22, 2026',
    badge: 'Previous',
    badgeColor: 'bg-slate-500/8 text-slate-600 dark:text-slate-400 border-slate-500/15',
    icon: Zap,
    iconColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    title: 'Premium UI Overhaul & Today\'s Report Table',
    changes: [
      'Complete UI redesign with glassmorphism card system — every card uses frosted glass with backdrop blur, layered shadows, and gradient glow borders.',
      'Switched global font to Inter (300–900 weights) for sharper, more legible typography.',
      'Built animated shimmer gradient backgrounds for hero banners, buttons, and avatar initials.',
      'Redesigned Today\'s Report Summary into a full detail table showing Sr No, QA Member, Work Type, Task Performed, and Status for all 3 members.',
      'Upgraded color palette from neutral grayscale to a violet-tinted oklch system.',
    ],
  },
  {
    version: 'v1.3.0',
    date: 'July 22, 2026',
    badge: 'Previous',
    badgeColor: 'bg-slate-500/8 text-slate-600 dark:text-slate-400 border-slate-500/15',
    icon: Zap,
    iconColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    title: 'QA Member-wise Analytics & Performance Leaderboard',
    changes: [
      'Added QA Member-wise Analytics tab to track individual performance metrics.',
      'Created work type distribution bar charts and weekly activity trends.',
      'Added visual Gold, Silver, and Bronze trophy indicator rankings to the Performance Leaderboard.',
    ],
  },
  {
    version: 'v1.2.0',
    date: 'July 21, 2026',
    badge: 'Previous',
    badgeColor: 'bg-slate-500/8 text-slate-600 dark:text-slate-400 border-slate-500/15',
    icon: Shield,
    iconColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    title: 'Task Assignment Module & Live Notifications',
    changes: [
      'Launched Assign Tasks module allowing Team Leader to assign specific tasks with High, Medium, or Low priorities.',
      'Created live assignment cards showing due dates, assignee metadata, and progress status tracking.',
      'Activated top header Notification Bell dropdown with unread badge updates.',
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
      'Dropped UNIQUE constraints to allow engineers to submit multiple distinct task reports per day.',
      'Configured Supabase Realtime WebSocket client subscriptions for live table updates.',
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
      'Created standard Daily Report form with auto-save draft functionality.',
      'Connected Supabase tables with Row Level Security (RLS) policies.',
    ],
  },
];

export default function VersionHistoryPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">

      {/* ── TOP SECTION: ABOUT & DEVELOPER PROFILE ── */}
      <div className="glass-card glow-card overflow-hidden">
        <div className="h-1.5 shimmer-bg" />
        <div className="p-6 md:p-8 space-y-6">

          {/* Developer Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-border/15 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl shimmer-bg flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary/20 shrink-0">
                MC
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black tracking-tight text-foreground">Mehul Chikhaliya</h2>
                </div>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  Mail: mehul.chikhaliya
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-xl bg-background/60 border-border/30">
                <Code2 className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Next.js 16 + React 19
              </Badge>
              <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-xl bg-background/60 border-border/30">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                Supabase Realtime
              </Badge>
            </div>
          </div>

          {/* About System Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              About QA Daily Task & Operations Portal
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              The <b>QA Daily Task & Operations Portal</b> is a specialized web application engineered for the Process Quality Assurance team to streamline daily task reporting, real-time activity tracking, automated Google Chat notifications, task assignment delegation, and executive impact analysis.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {[
              { title: 'Daily Task Reporting', desc: 'Fast task submissions with custom work types & manual date selection', icon: CheckCircle2, color: 'text-emerald-500' },
              { title: 'Google Chat Webhooks', desc: 'Formatted card summaries posted directly to Gmail/Google Chat groups', icon: MessageSquare, color: 'text-blue-500' },
              { title: 'Task Assignment System', desc: 'Assign, prioritize & track tasks across team members with real-time sync', icon: UserCheck, color: 'text-violet-500' },
              { title: 'Process Impact Review', desc: 'Executive dashboard with KPI metrics & 5 interactive visual charts', icon: Shield, color: 'text-amber-500' },
              { title: 'QA Analytics & Trophy Board', desc: 'Member-wise productivity metrics, completion rates & gold/silver trophies', icon: Zap, color: 'text-orange-500' },
              { title: 'Glassmorphism Design', desc: 'Modern responsive UI with Inter font, dark mode & ambient background glow', icon: Sparkles, color: 'text-primary' },
            ].map((f, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-background/50 border border-border/20 space-y-1">
                <div className="flex items-center gap-2">
                  <f.icon className={`h-4 w-4 ${f.color}`} />
                  <h4 className="text-xs font-bold tracking-tight">{f.title}</h4>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium leading-normal">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── BOTTOM SECTION: VERSION HISTORY TIMELINE ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Version History & Changelog
          </h2>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Complete feature updates and portal release history</p>
        </div>

        <div className="relative border-l-2 border-border/20 pl-7 ml-4 space-y-8 py-2">
          {VERSIONS.map((item) => {
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

    </div>
  );
}
