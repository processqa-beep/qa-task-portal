'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie,
  AreaChart, Area,
  CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts';
import {
  TrendingUp, PlusCircle, Trash2, CheckCircle2, Sparkles,
  Target, Zap, BarChart3, Shield, Clock, Award, AlertCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
type ImpactLevel    = 'Critical' | 'High' | 'Medium' | 'Low';
type ImpactCategory = 'Quality' | 'Compliance' | 'Automation' | 'Process' | 'Cost Saving' | 'Customer' | 'Safety';

interface ImpactEntry {
  id: string;
  taskTitle: string;
  category: ImpactCategory;
  impactLevel: ImpactLevel;
  description: string;
  measurableResult: string;
  assignee: string;
  date: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const IMPACT_LEVELS:     ImpactLevel[]    = ['Critical', 'High', 'Medium', 'Low'];
const IMPACT_CATEGORIES: ImpactCategory[] = ['Quality', 'Compliance', 'Automation', 'Process', 'Cost Saving', 'Customer', 'Safety'];
const QA_MEMBERS = ['Hiren Dodiya', 'Purvesh Kapadiya', 'Mehul Chikhaliya'];

const LEVEL_COLORS: Record<ImpactLevel, string> = {
  Critical: 'oklch(0.58 0.22 25)',
  High:     'oklch(0.60 0.18 45)',
  Medium:   'oklch(0.58 0.18 270)',
  Low:      'oklch(0.60 0.18 150)',
};
const LEVEL_BADGE: Record<ImpactLevel, string> = {
  Critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  High:     'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Medium:   'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Low:      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};
const CAT_COLORS: Record<ImpactCategory, string> = {
  Quality:      'oklch(0.58 0.22 270)',
  Compliance:   'oklch(0.60 0.18 150)',
  Automation:   'oklch(0.55 0.22 280)',
  Process:      'oklch(0.75 0.15 80)',
  'Cost Saving':'oklch(0.60 0.18 25)',
  Customer:     'oklch(0.58 0.18 200)',
  Safety:       'oklch(0.55 0.20 45)',
};

// ─── Initial Demo Data ────────────────────────────────────────────────────────
const INITIAL_IMPACTS: ImpactEntry[] = [
  { id:'1', taskTitle:'Kaveri 3S Customer Audit', category:'Compliance', impactLevel:'Critical',
    description:'Completed full customer audit at Kaveri plant with zero critical deviations found.',
    measurableResult:'100% compliance rate, 0 NCRs raised', assignee:'Hiren Dodiya', date:'2026-07-21' },
  { id:'2', taskTitle:'DuckDB Automation Pipeline', category:'Automation', impactLevel:'High',
    description:'Automated thickness measurement log pipeline, reducing manual reporting by 3 hours/day.',
    measurableResult:'3 hrs/day saved, 100% data accuracy', assignee:'Mehul Chikhaliya', date:'2026-07-20' },
  { id:'3', taskTitle:'Cloud Vision Dashboard Optimization', category:'Quality', impactLevel:'High',
    description:'Designed comparative charts for glass width deviation tracking across Kaveri tempering line.',
    measurableResult:'Deviation detection improved by 40%', assignee:'Mehul Chikhaliya', date:'2026-07-19' },
  { id:'4', taskTitle:'Plant Layout & DMS Objectives', category:'Process', impactLevel:'Medium',
    description:'Prepared comprehensive Plant Objectives Deployment matrices linked to QHSE standards.',
    measurableResult:'12 objectives mapped, 3 plant sections covered', assignee:'Purvesh Kapadiya', date:'2026-07-18' },
  { id:'5', taskTitle:'Anti-static Bar Bug Fix – SG#3.2', category:'Quality', impactLevel:'High',
    description:'Resolved static anti-static bar functionality bugs in Kaveri tempering line.',
    measurableResult:'Dust spot defects reduced by 60%', assignee:'Purvesh Kapadiya', date:'2026-07-17' },
  { id:'6', taskTitle:'IMS Documentation Update', category:'Compliance', impactLevel:'Medium',
    description:'Updated IMS documentation to reflect latest process changes and audit findings.',
    measurableResult:'15 documents updated, 100% traceability', assignee:'Hiren Dodiya', date:'2026-07-16' },
];

const EMPTY_FORM = {
  taskTitle:'', category:'Quality' as ImpactCategory, impactLevel:'High' as ImpactLevel,
  description:'', measurableResult:'', assignee: QA_MEMBERS[0],
  date: new Date().toISOString().split('T')[0],
};

// ─── Chart insight captions ────────────────────────────────────────────────────
const CHART_CAPTIONS: Record<string, string> = {
  category:   'Shows how QA work is distributed across different areas. High bars indicate where most effort and improvement is happening.',
  level:      'Breaks down impact entries by severity. More Critical and High entries signal strong, measurable contributions to the plant.',
  member:     'Compares each QA member\'s contribution by impact level. Taller bars = more impactful work delivered.',
  radar:      'Shows how well each QA member covers all impact categories. A wider shape means broader coverage across quality areas.',
  timeline:   'Tracks how many impactful activities were logged each day. Peaks indicate high-productivity days.',
  quality:    'Measures the quality defect reduction rate over time. Rising line = fewer defects found, better process health.',
  cost:       'Tracks daily time saved through automation and process improvements — directly translating to cost savings.',
};

// ─── Recharts custom label renderer ──────────────────────────────────────────
const DataLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="currentColor" textAnchor="middle" fontSize={10} fontWeight={700} className="fill-foreground">
      {value}
    </text>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-3 text-xs space-y-1 shadow-xl border border-border/20">
        <p className="font-bold text-foreground">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color ?? p.fill }} className="font-semibold">
            {p.name}: <span className="text-foreground font-black">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Chart Insight Box ────────────────────────────────────────────────────────
function ChartInsight({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 mt-3 px-1 pb-1">
      <Info className="h-3.5 w-3.5 text-primary/60 mt-0.5 shrink-0" />
      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ImpactReviewPage() {
  const [impacts, setImpacts]         = useState<ImpactEntry[]>(INITIAL_IMPACTS);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [showForm, setShowForm]       = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterCat, setFilterCat]     = useState<string>('All');

  // ── Analytics derived data ──────────────────────────────────────────────
  const filtered = useMemo(() =>
    impacts.filter(i =>
      (filterLevel === 'All' || i.impactLevel === filterLevel) &&
      (filterCat   === 'All' || i.category   === filterCat)
    ), [impacts, filterLevel, filterCat]);

  const categoryData = useMemo(() =>
    IMPACT_CATEGORIES.map(cat => ({
      name: cat, count: impacts.filter(i => i.category === cat).length, fill: CAT_COLORS[cat],
    })).filter(d => d.count > 0), [impacts]);

  const levelData = useMemo(() =>
    IMPACT_LEVELS.map(lvl => ({
      name: lvl, count: impacts.filter(i => i.impactLevel === lvl).length, fill: LEVEL_COLORS[lvl],
    })), [impacts]);

  const memberData = useMemo(() =>
    QA_MEMBERS.map(m => ({
      name: m.split(' ')[0], fullName: m,
      Critical: impacts.filter(i => i.assignee === m && i.impactLevel === 'Critical').length,
      High:     impacts.filter(i => i.assignee === m && i.impactLevel === 'High').length,
      Medium:   impacts.filter(i => i.assignee === m && i.impactLevel === 'Medium').length,
      Low:      impacts.filter(i => i.assignee === m && i.impactLevel === 'Low').length,
      Total:    impacts.filter(i => i.assignee === m).length,
    })), [impacts]);

  const radarData = useMemo(() =>
    IMPACT_CATEGORIES.map(cat => {
      const entry: Record<string, any> = { category: cat };
      QA_MEMBERS.forEach(m => { entry[m.split(' ')[0]] = impacts.filter(i => i.assignee === m && i.category === cat).length; });
      return entry;
    }), [impacts]);

  const timelineData = useMemo(() => {
    const byDate: Record<string, number> = {};
    impacts.forEach(i => { byDate[i.date] = (byDate[i.date] || 0) + 1; });
    return Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      impacts: count,
    }));
  }, [impacts]);

  // Simulated quality trend (defect reduction %)
  const qualityTrendData = useMemo(() => [
    { week: 'Wk 1', defectRate: 8.2, target: 5 },
    { week: 'Wk 2', defectRate: 6.5, target: 5 },
    { week: 'Wk 3', defectRate: 5.1, target: 5 },
    { week: 'Wk 4', defectRate: 3.8, target: 5 },
  ], []);

  // Time saved per day (cost saving proxy)
  const timeSavedData = useMemo(() => [
    { day: 'Mon', hours: 1.5 },
    { day: 'Tue', hours: 2.0 },
    { day: 'Wed', hours: 3.0 },
    { day: 'Thu', hours: 2.5 },
    { day: 'Fri', hours: 4.0 },
  ], []);

  // KPIs
  const totalImpacts    = impacts.length;
  const criticalCount   = impacts.filter(i => i.impactLevel === 'Critical').length;
  const highCount       = impacts.filter(i => i.impactLevel === 'High').length;
  const uniqueCategories= new Set(impacts.map(i => i.category)).size;

  const handleAdd = () => {
    if (!form.taskTitle.trim() || !form.description.trim()) { toast.error('Fill in Task Title and Description'); return; }
    setImpacts(prev => [{ ...form, id: Date.now().toString() }, ...prev]);
    setForm(EMPTY_FORM); setShowForm(false);
    toast.success('Impact entry added!');
  };

  const handleDelete = (id: string) => { setImpacts(prev => prev.filter(i => i.id !== id)); toast.success('Entry removed'); };

  const MEMBER_COLORS = ['oklch(0.58 0.22 270)', 'oklch(0.60 0.18 150)', 'oklch(0.75 0.15 80)'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Impact Review
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
            Track, measure and present QA team impact for leadership review
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}
          className="shimmer-bg text-white h-10 rounded-xl px-5 shadow-md shadow-primary/20 font-semibold text-sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Impact Entry
        </Button>
      </div>

      {/* ── Add Form ── */}
      {showForm && (
        <div className="glass-card glow-card overflow-hidden">
          <div className="h-1 shimmer-bg" />
          <div className="p-6">
            <h3 className="text-sm font-bold tracking-tight mb-5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> New Impact Entry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Task / Activity Title *</Label>
                <Input placeholder="e.g. Kaveri Customer Audit – Zero Defect Result"
                  value={form.taskTitle} onChange={e => setForm({...form, taskTitle: e.target.value})}
                  className="h-11 rounded-xl border-border/30 bg-background/60 font-medium" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Impact Category *</Label>
                <Select value={form.category} onValueChange={v => v && setForm({...form, category: v as ImpactCategory})}>
                  <SelectTrigger className="h-11 rounded-xl border-border/30 bg-background/60 font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-card border-border/30">
                    {IMPACT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Impact Level *</Label>
                <Select value={form.impactLevel} onValueChange={v => v && setForm({...form, impactLevel: v as ImpactLevel})}>
                  <SelectTrigger className="h-11 rounded-xl border-border/30 bg-background/60 font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-card border-border/30">
                    {IMPACT_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">QA Member *</Label>
                <Select value={form.assignee} onValueChange={v => v && setForm({...form, assignee: v})}>
                  <SelectTrigger className="h-11 rounded-xl border-border/30 bg-background/60 font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-card border-border/30">
                    {QA_MEMBERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                  className="h-11 rounded-xl border-border/30 bg-background/60 font-medium" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">What was done? *</Label>
                <Textarea placeholder="Describe the task/activity performed and how it created impact..."
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  rows={3} className="resize-none rounded-xl border-border/30 bg-background/60 font-medium" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Measurable Result / Outcome</Label>
                <Input placeholder="e.g. 40% reduction in defects, 2 hrs saved daily, 0 NCRs raised..."
                  value={form.measurableResult} onChange={e => setForm({...form, measurableResult: e.target.value})}
                  className="h-11 rounded-xl border-border/30 bg-background/60 font-medium" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={handleAdd} className="shimmer-bg text-white h-10 px-6 rounded-xl shadow-md shadow-primary/15 font-bold">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Save Impact Entry
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="h-10 px-5 rounded-xl border-border/30 font-semibold">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Impacts', value: totalImpacts,    icon: Target,      bg:'bg-primary/10',    color:'text-primary' },
          { label:'Critical',      value: criticalCount,   icon: AlertCircle, bg:'bg-red-500/10',    color:'text-red-500' },
          { label:'High Impact',   value: highCount,       icon: Zap,         bg:'bg-orange-500/10', color:'text-orange-500' },
          { label:'Categories',    value: uniqueCategories,icon: Award,       bg:'bg-emerald-500/10',color:'text-emerald-500' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card glow-card p-5 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
              <p className={`text-2xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW 1: Category Bar + Level Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Category Bar with data labels */}
        <div className="glass-card glow-card overflow-hidden">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold tracking-tight">Impact by Category</h3>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Number of entries per work category</p>
          </div>
          <div className="px-5 pb-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ left:-10, right:5, top:20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:10, fontWeight:600 }} tickLine={false} />
                  <YAxis tick={{ fontSize:10 }} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[6,6,0,0]} barSize={28}>
                    <LabelList dataKey="count" content={<DataLabel />} />
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <ChartInsight text={CHART_CAPTIONS.category} />
          <div className="h-4" />
        </div>

        {/* Level Donut + progress bars */}
        <div className="glass-card glow-card overflow-hidden">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold tracking-tight">Impact Level Breakdown</h3>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Distribution of Critical / High / Medium / Low</p>
          </div>
          <div className="px-5 pb-2 flex items-center gap-6">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={levelData} dataKey="count" nameKey="name"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={4} strokeWidth={0}
                    label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {levelData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {levelData.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <span className="font-black">{item.count} <span className="text-muted-foreground font-medium text-[10px]">({totalImpacts ? Math.round(item.count/totalImpacts*100) : 0}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/20 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width:`${totalImpacts ? (item.count/totalImpacts)*100 : 0}%`, backgroundColor: item.fill }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ChartInsight text={CHART_CAPTIONS.level} />
          <div className="h-4" />
        </div>
      </div>

      {/* ── CHARTS ROW 2: Member Stacked Bar + Radar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Member Stacked Bar with total labels */}
        <div className="glass-card glow-card overflow-hidden">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold tracking-tight">QA Member Contribution</h3>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Impact levels stacked per QA member</p>
          </div>
          <div className="px-5 pb-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberData} margin={{ left:-10, right:5, top:20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fontWeight:700 }} tickLine={false} />
                  <YAxis tick={{ fontSize:10 }} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize:10, fontWeight:600, paddingTop:8 }} />
                  <Bar dataKey="Critical" stackId="a" fill={LEVEL_COLORS.Critical} />
                  <Bar dataKey="High"     stackId="a" fill={LEVEL_COLORS.High} />
                  <Bar dataKey="Medium"   stackId="a" fill={LEVEL_COLORS.Medium} />
                  <Bar dataKey="Low"      stackId="a" fill={LEVEL_COLORS.Low} radius={[6,6,0,0]}>
                    <LabelList dataKey="Total" position="top" style={{ fontSize:10, fontWeight:700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <ChartInsight text={CHART_CAPTIONS.member} />
          <div className="h-4" />
        </div>

        {/* Radar: Category coverage */}
        <div className="glass-card glow-card overflow-hidden">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold tracking-tight">Category Coverage Radar</h3>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">How each member covers all impact areas</p>
          </div>
          <div className="px-5 pb-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top:5, right:20, bottom:5, left:20 }}>
                  <PolarGrid className="stroke-border/30" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize:9, fontWeight:600 }} />
                  {QA_MEMBERS.map((m, i) => (
                    <Radar key={m} name={m.split(' ')[0]} dataKey={m.split(' ')[0]}
                      stroke={MEMBER_COLORS[i]} fill={MEMBER_COLORS[i]} fillOpacity={0.08} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize:10, fontWeight:600 }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <ChartInsight text={CHART_CAPTIONS.radar} />
          <div className="h-4" />
        </div>
      </div>

      {/* ── TIMELINE Area Chart ── */}
      <div className="glass-card glow-card overflow-hidden">
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2 mb-0.5">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold tracking-tight">Impact Timeline</h3>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">Impactful activities logged per day across the team</p>
        </div>
        <div className="px-5 pb-2">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ left:-10, right:10, top:20 }}>
                <defs>
                  <linearGradient id="impactGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="oklch(0.52 0.2 270)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="oklch(0.52 0.2 270)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" />
                <XAxis dataKey="date" tick={{ fontSize:10, fontWeight:500 }} tickLine={false} />
                <YAxis tick={{ fontSize:10 }} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="impacts" stroke="oklch(0.52 0.2 270)" strokeWidth={2.5} fill="url(#impactGrad)">
                  <LabelList dataKey="impacts" position="top" style={{ fontSize:10, fontWeight:700 }} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <ChartInsight text={CHART_CAPTIONS.timeline} />
        <div className="h-4" />
      </div>

      {/* ── Filters + Detail Table ── */}
      <div className="glass-card glow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/15 bg-muted/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight">All Impact Entries</h3>
              <p className="text-[11px] text-muted-foreground font-medium">{filtered.length} entries shown</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterLevel} onValueChange={v => v && setFilterLevel(v)}>
                <SelectTrigger className="h-8 text-xs w-[130px] rounded-xl border-border/30 bg-background/60 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/30">
                  <SelectItem value="All">All Levels</SelectItem>
                  {IMPACT_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCat} onValueChange={v => v && setFilterCat(v)}>
                <SelectTrigger className="h-8 text-xs w-[145px] rounded-xl border-border/30 bg-background/60 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/30">
                  <SelectItem value="All">All Categories</SelectItem>
                  {IMPACT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/[0.03] hover:bg-muted/[0.03] border-b border-border/15">
                {['Sr','Task / Activity','Category','Level','QA Member','Measurable Result','Date',''].map((h,i) => (
                  <TableHead key={i} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, idx) => (
                <TableRow key={item.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                  <TableCell className="py-3 text-center">
                    <span className="text-[11px] font-bold text-muted-foreground">{idx+1}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-xs font-bold tracking-tight leading-snug">{item.taskTitle}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">{item.description}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 rounded-lg"
                      style={{ backgroundColor:`${CAT_COLORS[item.category]}12`, color:CAT_COLORS[item.category], borderColor:`${CAT_COLORS[item.category]}30` }}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${LEVEL_BADGE[item.impactLevel]}`}>
                      {item.impactLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg shimmer-bg flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                        {item.assignee.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <span className="text-xs font-semibold">{item.assignee.split(' ')[0]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{item.measurableResult || '—'}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(item.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <button onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
