import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TaskItem {
  work_type: string;
  task_performed: string;
  status: string;
  remarks?: string | null;
}

interface NotificationBody {
  webhookUrl?: string;
  employeeName: string;
  employeeId: string;
  date: string;
  tasks: TaskItem[];
}

const WORK_TYPE_COLORS: Record<string, string> = {
  'Testing': '#2563eb',
  'Regression': '#7c3aed',
  'Automation': '#059669',
  'Bug Verification': '#dc2626',
  'Documentation': '#d97706',
  'Meeting': '#0891b2',
  'Cloud Vision': '#6d28d9',
  'Data Analysis': '#0d9488',
  'IMS': '#be185d',
  'Process Audit': '#ea580c',
  'Devlopment': '#4f46e5',
  'Development': '#4f46e5',
  'Additional': '#0284c7',
  'Other': '#4b5563',
};

// Global in-memory cache for Team Google Chat Webhook URL (synced across all devices)
let SAVED_SERVER_WEBHOOK = process.env.GOOGLE_CHAT_WEBHOOK_URL || process.env.NEXT_PUBLIC_GOOGLE_CHAT_WEBHOOK_URL || '';

// Log of dates posted to prevent double-posting on auto 7 PM trigger
const POSTED_DATES_LOG = new Set<string>();

export async function getSavedWebhookUrlAsync(): Promise<string> {
  if (SAVED_SERVER_WEBHOOK && SAVED_SERVER_WEBHOOK.trim().startsWith('http')) {
    return SAVED_SERVER_WEBHOOK.trim();
  }

  // Fetch from Supabase system_settings table if available
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'google_chat_webhook')
      .single();

    if (data && data.value && String(data.value).trim().startsWith('http')) {
      SAVED_SERVER_WEBHOOK = String(data.value).trim();
      return SAVED_SERVER_WEBHOOK;
    }
  } catch {
    // ignore
  }

  return process.env.GOOGLE_CHAT_WEBHOOK_URL || process.env.NEXT_PUBLIC_GOOGLE_CHAT_WEBHOOK_URL || '';
}

export function getSavedWebhookUrl(): string {
  return SAVED_SERVER_WEBHOOK;
}

export async function saveWebhookUrlToDatabase(url: string) {
  if (!url || !url.trim().startsWith('http')) return;
  const cleanUrl = url.trim();
  SAVED_SERVER_WEBHOOK = cleanUrl;

  try {
    const supabase = await createClient();
    await supabase.from('system_settings').upsert({
      key: 'google_chat_webhook',
      value: cleanUrl,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Supabase save google_chat_webhook error:', err);
  }
}

export function hasDateBeenPosted(dateStr: string): boolean {
  return POSTED_DATES_LOG.has(dateStr);
}

export function markDateAsPosted(dateStr: string) {
  POSTED_DATES_LOG.add(dateStr);
}

function formatDateNice(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export async function sendCardToGoogleChat(body: NotificationBody): Promise<{ success: boolean; error?: string }> {
  const { webhookUrl, employeeName, employeeId, date, tasks } = body;

  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    await saveWebhookUrlToDatabase(webhookUrl.trim());
  }

  const activeWebhook = await getSavedWebhookUrlAsync();
  const targetWebhookUrl =
    (webhookUrl && webhookUrl.trim().startsWith('http') ? webhookUrl.trim() : '') ||
    activeWebhook ||
    process.env.GOOGLE_CHAT_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_GOOGLE_CHAT_WEBHOOK_URL;

  if (!targetWebhookUrl) {
    return { success: false, error: 'Google Chat Webhook URL is not configured.' };
  }

  if (!tasks || tasks.length === 0) {
    return { success: false, error: 'No tasks provided to send' };
  }

  const niceDate = formatDateNice(date);

  const formattedTaskWidgets = tasks.map((t, idx) => {
    const color = WORK_TYPE_COLORS[t.work_type] || '#2563eb';
    const number = idx + 1;

    let text = `<b>${number}.</b> &nbsp; <font color="${color}"><b>${t.work_type.toUpperCase()}:</b></font> ${t.task_performed.replace(/\n/g, '<br>')}`;
    if (t.remarks) {
      text += `<br><font color="#6b7280"><i>Note: ${t.remarks}</i></font>`;
    }
    return {
      textParagraph: {
        text: text,
      },
    };
  });

  const cardPayload = {
    cardsV2: [
      {
        cardId: `daily-report-${employeeId}-${Date.now()}`,
        card: {
          header: {
            title: `📋 QA Activity Report for ${employeeName} (${employeeId})`,
            subtitle: `📅 ${niceDate}`,
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/906/906343.png',
            imageType: 'CIRCLE',
          },
          sections: [
            {
              header: `<b>Daily Tasks Summary (${tasks.length})</b>`,
              widgets: formattedTaskWidgets,
            },
          ],
        },
      },
    ],
  };

  try {
    const googleRes = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(cardPayload),
    });

    if (googleRes.ok) {
      markDateAsPosted(date);
      return { success: true };
    } else {
      const errText = await googleRes.text();
      return { success: false, error: `Google Chat returned error: ${errText}` };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network failure' };
  }
}

export async function GET() {
  const activeWebhook = await getSavedWebhookUrlAsync();
  return NextResponse.json({
    webhookUrl: activeWebhook,
    postedDates: Array.from(POSTED_DATES_LOG),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationBody = await request.json();

    if (body.webhookUrl && body.webhookUrl.trim().startsWith('http')) {
      await saveWebhookUrlToDatabase(body.webhookUrl.trim());
    }

    const result = await sendCardToGoogleChat(body);

    if (result.success) {
      return NextResponse.json({ success: true, count: body.tasks?.length || 0 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
