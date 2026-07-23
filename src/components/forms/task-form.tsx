'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Send, CheckCircle2, PlusCircle, FileText, MessageSquare, ExternalLink } from 'lucide-react';
import { WORK_TYPES, TASK_STATUSES, DRAFT_STORAGE_KEY } from '@/lib/constants';
import { TaskFormData, DailyTask } from '@/lib/types';
import { formatDate, getToday } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { sendGoogleChatNotification, TaskItemPayload } from '@/lib/google-chat';

interface TaskFormProps {
  existingTask?: DailyTask | null;
  onSuccess?: () => void;
}

const REPORTING_ENGINEERS = [
  { id: 'QA002', name: 'Hiren Dodiya' },
  { id: 'QA003', name: 'Purvesh Kapadiya' },
  { id: 'QA004', name: 'Mehul Chikhaliya' },
];

export function TaskForm({ existingTask, onSuccess }: TaskFormProps) {
  const { employee } = useAuth();
  const router = useRouter();
  const { value: draft, setValue: saveDraft, removeValue: clearDraft, isLoaded } = useLocalStorage<Partial<TaskFormData>>(DRAFT_STORAGE_KEY, {});

  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    employee?.id === 'QA001' ? 'QA004' : (employee?.id || 'QA004')
  );

  const [allWorkTypes, setAllWorkTypes] = useState<string[]>(WORK_TYPES);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(getToday());

  // Webhook settings state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const [formData, setFormData] = useState<TaskFormData>({
    work_type: 'Testing',
    task_performed: '',
    status: 'Completed',
    remarks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Load custom work types & webhook URL from localStorage
  useEffect(() => {
    const storedTypes = localStorage.getItem('qa-custom-work-types');
    if (storedTypes) {
      try {
        const parsed = JSON.parse(storedTypes) as string[];
        setAllWorkTypes([...WORK_TYPES, ...parsed]);
      } catch {
        // ignore
      }
    }

    const savedWebhook = localStorage.getItem('qa-google-chat-webhook') || process.env.NEXT_PUBLIC_GOOGLE_CHAT_WEBHOOK_URL || '';
    if (savedWebhook) {
      setWebhookUrl(savedWebhook);
    }
  }, []);

  const handleSaveWebhook = () => {
    const trimmed = webhookUrl.trim();
    if (trimmed) {
      localStorage.setItem('qa-google-chat-webhook', trimmed);
      toast.success('Google Chat Webhook URL saved!');
    } else {
      localStorage.removeItem('qa-google-chat-webhook');
      toast.info('Google Chat Webhook cleared');
    }
    setShowWebhookConfig(false);
  };

  const handleTestWebhook = async () => {
    const targetUrl = webhookUrl.trim() || localStorage.getItem('qa-google-chat-webhook') || '';
    if (!targetUrl) {
      toast.error('Please enter a Webhook URL to test');
      return;
    }

    setIsTestingWebhook(true);
    try {
      const res = await sendGoogleChatNotification({
        webhookUrl: targetUrl,
        employeeName: 'QA System Test',
        employeeId: 'TEST001',
        date: getToday(),
        tasks: [
          {
            work_type: 'Testing',
            task_performed: 'Connection Test from QA Daily Task Portal. Integration is working!',
            status: 'Completed',
            remarks: 'Test Message',
          },
        ],
      });

      if (res.success) {
        toast.success('Test message sent to Google Chat!', {
          description: 'Check your Google Chat space to see the test card.',
        });
      } else {
        toast.error('Google Chat test failed', {
          description: res.error || 'Check your Webhook URL',
        });
      }
    } catch (err) {
      toast.error('Failed to send test message');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleAddCustomType = () => {
    const trimmed = customTypeInput.trim();
    if (!trimmed) return;
    if (allWorkTypes.includes(trimmed)) {
      toast.error('Work type already exists');
      return;
    }

    const newTypes = [...allWorkTypes, trimmed];
    setAllWorkTypes(newTypes);

    const customOnly = newTypes.filter(t => !WORK_TYPES.includes(t as any));
    localStorage.setItem('qa-custom-work-types', JSON.stringify(customOnly));

    setFormData(prev => ({ ...prev, work_type: trimmed as any }));
    setCustomTypeInput('');
    setShowCustomInput(false);
    toast.success(`Custom work type "${trimmed}" added!`);
  };

  // Load existing task or draft
  useEffect(() => {
    if (existingTask) {
      setFormData({
        work_type: existingTask.work_type,
        task_performed: existingTask.task_performed,
        status: existingTask.status,
        remarks: existingTask.remarks || '',
      });
      setSelectedDate(existingTask.date);
    } else if (isLoaded && draft && Object.keys(draft).length > 0) {
      setFormData((prev) => ({ ...prev, ...draft }));
    }
  }, [existingTask, draft, isLoaded]);

  // Auto-save draft (debounced)
  const autoSave = useCallback(() => {
    if (!existingTask && formData.task_performed.trim()) {
      saveDraft(formData);
    }
  }, [formData, existingTask, saveDraft]);

  useEffect(() => {
    const timer = setTimeout(autoSave, 800);
    return () => clearTimeout(timer);
  }, [autoSave]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.task_performed.trim()) {
      toast.error('Please describe the task you performed');
      return;
    }

    setIsSubmitting(true);

    try {
      const empId = selectedEmpId;
      const matchedEmp = REPORTING_ENGINEERS.find(e => e.id === empId);
      const empName = matchedEmp?.name || employee?.name || empId;

      // 1. Save Task to Supabase or API fallback
      let insertSuccess = false;
      try {
        const { error } = await supabase.from('daily_tasks').insert({
          employee_id: empId,
          date: selectedDate,
          work_type: formData.work_type,
          task_performed: formData.task_performed.trim(),
          status: formData.status,
          remarks: formData.remarks?.trim() || null,
        });
        if (!error) insertSuccess = true;
      } catch {
        // ignore
      }

      if (!insertSuccess) {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: empId,
            date: selectedDate,
            ...formData,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to submit task');
        }
      }

      // 2. Fetch ALL tasks for this employee on selectedDate to send complete summary to Google Chat
      let todayTasksList: TaskItemPayload[] = [
        {
          work_type: formData.work_type,
          task_performed: formData.task_performed.trim(),
          status: formData.status,
          remarks: formData.remarks?.trim() || null,
        },
      ];

      try {
        const { data: existingTasks } = await supabase
          .from('daily_tasks')
          .select('work_type, task_performed, status, remarks')
          .or(`employee_id.eq.${empId},employee_id.eq.${empName}`)
          .eq('date', selectedDate);

        if (existingTasks && existingTasks.length > 0) {
          todayTasksList = existingTasks.map(t => ({
            work_type: t.work_type,
            task_performed: t.task_performed,
            status: t.status,
            remarks: t.remarks,
          }));
        }
      } catch {
        // use single task payload if fetch fails
      }

      // 3. Send ALL tasks for today to Google Chat Space via server API
      const savedWebhook = webhookUrl.trim() || localStorage.getItem('qa-google-chat-webhook') || '';
      sendGoogleChatNotification({
        webhookUrl: savedWebhook,
        employeeName: empName,
        employeeId: empId,
        date: selectedDate,
        tasks: todayTasksList,
      }).then(res => {
        if (res.success) {
          toast.success(`Posted ${todayTasksList.length} task(s) to Google Chat group!`);
        } else if (savedWebhook) {
          toast.warning('Google Chat notification issue', {
            description: res.error || 'Could not post to Google Chat',
          });
        }
      }).catch(err => {
        console.warn('Google Chat notification trigger error:', err);
      });

      clearDraft();
      setIsSubmitted(true);
      toast.success('Task submitted successfully!', {
        description: 'Your daily report has been saved.',
      });

      onSuccess?.();
    } catch (error) {
      toast.error('Failed to submit task', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      work_type: 'Testing',
      task_performed: '',
      status: 'Completed',
      remarks: '',
    });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="glass-card glow-card p-10 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold tracking-tight mb-1">Task Submitted Successfully!</h3>
        <p className="text-sm text-muted-foreground mb-6 font-medium">
          Your daily report for {formatDate(selectedDate)} has been recorded and posted to Google Chat.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleResetForm} className="rounded-xl border-border/30 hover:bg-primary/5 font-semibold">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Another Task
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            className="shimmer-bg text-white rounded-xl shadow-md shadow-primary/20 font-semibold"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card glow-card overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border/15">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                {existingTask ? 'Edit Task Report' : 'Daily Task Report'}
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                {formatDate(getToday(), 'EEEE, MMMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowWebhookConfig(!showWebhookConfig)}
              className="text-xs h-8 rounded-xl border-border/30 hover:bg-primary/5 font-semibold"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              Google Chat Integration
            </Button>
            {!existingTask && draft && Object.keys(draft).length > 0 && (
              <Badge variant="secondary" className="text-[10px] gap-1.5 bg-primary/[0.06] text-primary border-0 font-semibold rounded-lg px-2.5">
                <Save className="h-3 w-3" />
                Draft saved
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Google Chat Webhook Configuration Panel */}
      {showWebhookConfig && (
        <div className="p-4 bg-emerald-500/[0.04] border-b border-emerald-500/15 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-foreground">Google Chat Group Webhook</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Auto-posts daily summary to Gmail / Google Chat</span>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Input
              placeholder="Paste Google Chat Webhook URL (https://chat.googleapis.com/v1/spaces/...)"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="h-9 text-xs rounded-xl bg-background/80 border-border/30 font-medium flex-1"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveWebhook}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
              >
                Save URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleTestWebhook}
                disabled={isTestingWebhook}
                className="h-9 px-3 rounded-xl text-xs font-semibold shrink-0 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              >
                {isTestingWebhook ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Test Send
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
            💡 <b>How to get URL:</b> Open Google Chat Space ➔ Space Name menu ➔ Apps & Integrations ➔ Manage Webhooks ➔ Add Webhook ➔ Copy URL and paste here.
          </p>
        </div>
      )}

      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee Selection (3 Reporting QA Members) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Reporting QA Member *</Label>
            <Select
              value={selectedEmpId}
              onValueChange={(val) => val && setSelectedEmpId(val)}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/30 bg-background/60 font-medium">
                <SelectValue placeholder="Select QA Member" />
              </SelectTrigger>
              <SelectContent className="glass-card border-border/30">
                {REPORTING_ENGINEERS.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Date (Manual selection) */}
          <div className="space-y-2">
            <Label htmlFor="report_date" className="text-xs font-semibold">Report Date *</Label>
            <Input
              id="report_date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-11 rounded-xl border-border/30 bg-background/60 font-medium"
            />
          </div>

          {/* Work Type */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="work_type" className="text-xs font-semibold">Type of Work *</Label>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-[11px] text-primary hover:underline font-bold"
              >
                {showCustomInput ? 'Select Existing' : '+ Add Custom Type'}
              </button>
            </div>

            {showCustomInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter custom work type..."
                  value={customTypeInput}
                  onChange={(e) => setCustomTypeInput(e.target.value)}
                  className="h-11 rounded-xl border-border/30 bg-background/60 font-medium"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomType}
                  className="shimmer-bg text-white h-11 px-5 rounded-xl shadow-md shadow-primary/15 font-semibold"
                >
                  Add
                </Button>
              </div>
            ) : (
              <Select
                value={formData.work_type}
                onValueChange={(value) => value && setFormData({ ...formData, work_type: value as TaskFormData['work_type'] })}
              >
                <SelectTrigger className="h-11 rounded-xl border-border/30 bg-background/60 font-medium">
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/30">
                  {allWorkTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Task Performed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="task_performed" className="text-xs font-semibold">Task Performed *</Label>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {formData.task_performed.length}/500
              </span>
            </div>
            <Textarea
              id="task_performed"
              placeholder="Describe what you worked on today..."
              value={formData.task_performed}
              onChange={(e) => setFormData({ ...formData, task_performed: e.target.value.slice(0, 500) })}
              rows={4}
              className="resize-none rounded-xl border-border/30 bg-background/60 font-medium"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs font-semibold">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => value && setFormData({ ...formData, status: value as TaskFormData['status'] })}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/30 bg-background/60 font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="glass-card border-border/30">
                {TASK_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-xs font-semibold">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Any additional notes or blockers..."
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={2}
              className="resize-none rounded-xl border-border/30 bg-background/60 font-medium"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.task_performed.trim()}
            className="w-full h-12 shimmer-bg hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting & Posting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Daily Task Report & Post to Google Chat
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
