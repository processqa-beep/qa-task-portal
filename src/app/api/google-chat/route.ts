import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Global in-memory cache for Team Google Chat Webhook URL (synced across all devices)
let SAVED_SERVER_WEBHOOK = process.env.GOOGLE_CHAT_WEBHOOK_URL || process.env.NEXT_PUBLIC_GOOGLE_CHAT_WEBHOOK_URL || '';

function getDirectSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createSupabaseClient(url, key);
}

export async function getSavedWebhookUrlAsync(): Promise<string> {
  if (SAVED_SERVER_WEBHOOK && SAVED_SERVER_WEBHOOK.trim().startsWith('http')) {
    return SAVED_SERVER_WEBHOOK.trim();
  }

  // Fetch from Supabase system_settings table if available
  try {
    const supabase = getDirectSupabaseClient();
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'google_chat_webhook')
      .maybeSingle();

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
    const supabase = getDirectSupabaseClient();
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
  return false; // Allow multi-run execution so 7 PM cron always succeeds
}

export function markDateAsPosted(dateStr: string) {
  // no-op
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

export interface TaskItemPayload {
  work_type: string;
  task_performed: string;
  status: string;
  remarks?: string | null;
}

export interface SendCardParams {
  webhookUrl?: string;
  employeeName: string;
  employeeId: string;
  date: string;
  tasks: TaskItemPayload[];
}

export async function sendCardToGoogleChat({
  webhookUrl,
  employeeName,
  employeeId,
  date,
  tasks,
}: SendCardParams): Promise<{ success: boolean; error?: string }> {
  const targetWebhookUrl = webhookUrl || (await getSavedWebhookUrlAsync());

  if (!targetWebhookUrl || !targetWebhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      error: 'Google Chat Webhook URL is missing or invalid.',
    };
  }

  const formattedDateStr = formatDateNice(date);

  const taskListWidgets = tasks.map((t, idx) => {
    const isCompleted = t.status === 'Completed';
    const statusTag = isCompleted
      ? '<font color="#16a34a"><b>[Completed]</b></font>'
      : '<font color="#d97706"><b>[Pending]</b></font>';

    const workTypeTag = `<font color="#2563eb"><b>[${t.work_type}]</b></font>`;
    const remarksText = t.remarks ? `<br><i>Note: ${t.remarks}</i>` : '';

    return {
      textParagraph: {
        text: `<b>${idx + 1}.</b> ${workTypeTag} ${statusTag} ${t.task_performed}${remarksText}`,
      },
    };
  });

  const cardPayload = {
    cardsV2: [
      {
        cardId: `qa-task-${employeeId}-${date}-${Date.now()}`,
        card: {
          header: {
            title: `📋 QA Daily Task Report — ${employeeName}`,
            subtitle: `👤 ID: ${employeeId} · 📅 Date: ${formattedDateStr}`,
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png',
            imageType: 'CIRCLE',
          },
          sections: [
            {
              header: `<b>Task Details (${tasks.length} Activity Logged)</b>`,
              widgets: taskListWidgets,
            },
            {
              widgets: [
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'View QA Portal Dashboard',
                        onClick: {
                          openLink: {
                            url: 'https://qa-task-portal.vercel.app/dashboard',
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  try {
    const response = await fetch(targetWebhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(cardPayload),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `Google Chat API Error (${response.status}): ${errorText}`,
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error posting to Google Chat',
    };
  }
}

export async function GET() {
  const currentUrl = await getSavedWebhookUrlAsync();
  return NextResponse.json({
    webhookUrl: currentUrl,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.webhookUrl) {
      await saveWebhookUrlToDatabase(body.webhookUrl);
    }

    if (body.saveOnly) {
      return NextResponse.json({
        success: true,
        message: 'Webhook URL updated successfully.',
        webhookUrl: getSavedWebhookUrl(),
      });
    }

    const { employeeName, employeeId, date, tasks, webhookUrl } = body;

    if (!employeeName || !employeeId || !date || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Missing required parameters: employeeName, employeeId, date, tasks' },
        { status: 400 }
      );
    }

    const result = await sendCardToGoogleChat({
      webhookUrl: webhookUrl || (await getSavedWebhookUrlAsync()),
      employeeName,
      employeeId,
      date,
      tasks,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Task summary card for ${employeeName} posted to Google Chat successfully!`,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to post card to Google Chat' },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request payload' },
      { status: 400 }
    );
  }
}
