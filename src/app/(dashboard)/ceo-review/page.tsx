'use client';

import { Badge } from '@/components/ui/badge';
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
  AreaChart,
  Area,
  PieChart,
  Pie,
} from 'recharts';
import { TrendingUp, ShieldCheck, CheckCircle2, Award, Zap, BarChart3, Sparkles, Building } from 'lucide-react';

const WEEKLY_HIGHLIGHTS = [
  {
    title: 'Process Audits & Compliance Success',
    desc: 'Completed Kaveri 3S customer audit in the Kaveri plant. Formulated and verified kaizens for Kaveri tempering & double-edger line compliance, resulting in zero critical deviations.',
    badge: 'Audit Success',
    badgeColor: 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/15',
  },
  {
    title: 'Cloud Vision System & DuckDB Automation',
    desc: 'Optimized thickness measurement log pipelines by shifting database dump storage to 219 network server. Designed side-by-side comparative visualization charts to track glass width deviations.',
    badge: 'Automation',
    badgeColor: 'bg-violet-500/8 text-violet-600 dark:text-violet-400 border-violet-500/15',
  },
  {
    title: 'DMS objectives & Plant Layout Mapping',
    desc: 'Prepared comprehensive Plant Objectives Deployment matrices, linking floor level target metrics back to global QHSE standards. Prepared RM-to-dispatch workflow diagram for Kaveri Solar plant.',
    badge: 'QMS Standard',
    badgeColor: 'bg-blue-500/8 text-blue-600 dark:text-blue-400 border-blue-500/15',
  },
  {
    title: 'SG#3.2 Plant Equipment Troubleshooting',
    desc: 'Resolved static anti-static bar functionality bugs, adding custom air filtration filters to Kaveri tempering line layout to prevent dust spots on solar glass coating.',
    badge: 'Value Addition',
    badgeColor: 'bg-amber-500/8 text-amber-600 dark:text-amber-400 border-amber-500/15',
  },
];

const COMPLIANCE_TREND_DATA = [
  { week: 'Week 26', compliance: 92, target: 95 },
  { week: 'Week 27', compliance: 94, target: 95 },
  { week: 'Week 28', compliance: 97, target: 95 },
  { week: 'Week 29', compliance: 98, target: 95 },
];

const IMPACT_CATEGORY_DATA = [
  { name: 'IMS Compliance', value: 24, color: 'oklch(0.58 0.22 270)' },
  { name: 'Process Audits', value: 18, color: 'oklch(0.58 0.18 250)' },
  { name: 'Cloud Vision QA', value: 15, color: 'oklch(0.60 0.18 150)' },
  { name: 'Value Additions', value: 12, color: 'oklch(0.75 0.15 80)' },
];

const AUTOMATION_GROWTH_DATA = [
  { day: 'Mon', scripts: 12 },
  { day: 'Tue', scripts: 15 },
  { day: 'Wed', scripts: 18 },
  { day: 'Thu', scripts: 24 },
  { day: 'Fri', scripts: 32 },
];

export default function CeoReviewPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="relative overflow-hidden p-6 rounded-2xl shimmer-bg text-white shadow-xl shadow-primary/15">
        <div className="absolute top-0 right-0 h-40 w-40 bg-white/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-24 w-24 bg-white/[0.03] rounded-full blur-2xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <TrendingUp className="h-6 w-6 text-white/70" />
              Executive QA Performance & Impact Review
            </h1>
            <p className="text-[11px] text-white/60 max-w-2xl font-medium">
              High-value accomplishments, automation trends, compliance indices, and value-added deliverables for executive review.
            </p>
          </div>
          <Badge className="bg-white/[0.1] text-white border-white/[0.1] px-4 py-1.5 text-xs font-bold rounded-xl backdrop-blur-sm">CEO Briefing</Badge>
        </div>
      </div>

      {/* KPI Highlight Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card glow-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest">Weekly Audit Compliance</span>
            <p className="text-xl font-black text-violet-500 tracking-tight mt-0.5">98.4%</p>
          </div>
        </div>

        <div className="glass-card glow-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest">Value-Added Kaizens</span>
            <p className="text-xl font-black text-emerald-500 tracking-tight mt-0.5">12 Solved</p>
          </div>
        </div>

        <div className="glass-card glow-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest">Automation Test Cases</span>
            <p className="text-xl font-black text-amber-500 tracking-tight mt-0.5">32 Live</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Weekly Value Additions & Custom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Weekly Accomplishments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card glow-card overflow-hidden">
            <div className="p-5 pb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <Award className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold tracking-tight">Value Additions & Deliverables This Week</h3>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">High-impact quality assurance and process optimizations</p>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {WEEKLY_HIGHLIGHTS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-border/20 hover:border-primary/15 bg-background/30 hover:bg-primary/[0.02] transition-all duration-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs tracking-tight flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      {item.title}
                    </h4>
                    <Badge variant="outline" className={`text-[9px] px-2 py-0.5 rounded-lg font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-5 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Trend Chart */}
          <div className="glass-card glow-card overflow-hidden">
            <div className="p-5 pb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold tracking-tight">Compliance Progress Index (Weeks 26-29)</h3>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">Target vs actual floor quality standards compliance</p>
            </div>
            <div className="px-5 pb-5">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={COMPLIANCE_TREND_DATA} margin={{ left: 10, right: 10, top: 10 }}>
                    <defs>
                      <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.52 0.2 270)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="oklch(0.52 0.2 270)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" style={{ fontSize: 10, fontWeight: 500 }} tickLine={false} />
                    <YAxis domain={[80, 100]} style={{ fontSize: 10, fontWeight: 500 }} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                    <Area type="monotone" dataKey="compliance" stroke="oklch(0.52 0.2 270)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompliance)" />
                    <Line type="monotone" dataKey="target" stroke="oklch(0.60 0.18 150)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Charts & Distribution */}
        <div className="space-y-6">
          {/* Work Distribution Category pie */}
          <div className="glass-card glow-card overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-sm font-bold tracking-tight">QA Impact Share</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Resource distribution across key metrics</p>
            </div>
            <div className="px-5 pb-5">
              <div className="h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={IMPACT_CATEGORY_DATA}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {IMPACT_CATEGORY_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 mt-2">
                {IMPACT_CATEGORY_DATA.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}40` }} />
                      <span className="text-muted-foreground font-medium">{item.name}</span>
                    </div>
                    <span className="font-black tracking-tight">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Automation Test Case Growth Chart */}
          <div className="glass-card glow-card overflow-hidden">
            <div className="p-5 pb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <Building className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold tracking-tight">Cypress Automation Growth</h3>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">Cypress regression test case creations this week</p>
            </div>
            <div className="px-5 pb-5">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={AUTOMATION_GROWTH_DATA}>
                    <XAxis dataKey="day" style={{ fontSize: 10, fontWeight: 500 }} tickLine={false} />
                    <YAxis style={{ fontSize: 10, fontWeight: 500 }} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                    <Bar dataKey="scripts" fill="oklch(0.60 0.18 150)" radius={[6, 6, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
