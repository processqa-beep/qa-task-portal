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

export interface SendAssignmentParams {
  webhookUrl?: string;
  assigneeName: string;
  assigneeId: string;
  assignedBy: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
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

  const cleanTasks = (tasks || []).filter(
    (t) => t.task_performed && !t.task_performed.startsWith('[TASK_ASSIGNMENT]') && t.task_performed !== 'Not submitted yet'
  );

  const hasSubmittedTasks = cleanTasks.length > 0;

  const taskListWidgets = hasSubmittedTasks
    ? cleanTasks.map((t, idx) => {
        const workTypeUpper = (t.work_type || 'TASK').toUpperCase();
        const workTypeTag = `<font color="#2563eb"><b>[${workTypeUpper}]</b></font>`;
        const remarksText = t.remarks ? `<br><i>Note: ${t.remarks}</i>` : '';

        return {
          textParagraph: {
            text: `<b>${idx + 1}.</b> ${workTypeTag}: ${t.task_performed}${remarksText}`,
          },
        };
      })
    : [
        {
          textParagraph: {
            text: `<font color="#dc2626"><b>[NOT SUBMITTED YET]</b></font><br><i>No daily task report submitted for this date.</i>`,
          },
        },
      ];

  const cardPayload = {
    cardsV2: [
      {
        cardId: `qa-task-${employeeId}-${date}-${Date.now()}`,
        card: {
          header: {
            title: `📋 QA Daily Task Report`,
            subtitle: `📅 ${formattedDateStr}`,
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png',
            imageType: 'CIRCLE',
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `<b>👤 QA Engineer:</b> ${employeeName} (${employeeId})<br><b>📅 Report Date:</b> ${formattedDateStr}<br><b>📊 Status:</b> ${hasSubmittedTasks ? '<font color="#16a34a"><b>Submitted</b></font>' : '<font color="#dc2626"><b>⚠️ Pending / Not Submitted Yet</b></font>'}`,
                  },
                },
              ],
            },
            {
              header: `<b>Task Activity Log (${hasSubmittedTasks ? tasks.length : 0} Items)</b>`,
              widgets: taskListWidgets,
            },
            {
              widgets: [
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'Open QA Portal Dashboard',
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

export async function sendAssignmentCardToGoogleChat({
  webhookUrl,
  assigneeName,
  assigneeId,
  assignedBy,
  title,
  description,
  dueDate,
  priority,
}: SendAssignmentParams): Promise<{ success: boolean; error?: string }> {
  const targetWebhookUrl = webhookUrl || (await getSavedWebhookUrlAsync());

  if (!targetWebhookUrl || !targetWebhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      error: 'Google Chat Webhook URL is missing or invalid.',
    };
  }

  const formattedDateStr = formatDateNice(dueDate);
  const priorityColor =
    priority === 'Critical'
      ? '#dc2626'
      : priority === 'High'
      ? '#ea580c'
      : priority === 'Medium'
      ? '#2563eb'
      : '#16a34a';

  const cardPayload = {
    cardsV2: [
      {
        cardId: `qa-assignment-${assigneeId}-${Date.now()}`,
        card: {
          header: {
            title: `📌 New Task Assigned — ${assigneeName}`,
            subtitle: `👤 Assigned To: ${assigneeName} (${assigneeId})`,
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/906/906343.png',
            imageType: 'CIRCLE',
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `<b>👤 Assigned To:</b> ${assigneeName} (${assigneeId})<br><b>👨‍💼 Assigned By:</b> ${assignedBy}<br><b>📅 Due Date:</b> ${formattedDateStr}<br><b>🚨 Priority:</b> <font color="${priorityColor}"><b>${priority.toUpperCase()}</b></font>`,
                  },
                },
                {
                  textParagraph: {
                    text: `<b>📌 Task Title:</b><br>${title}`,
                  },
                },
                {
                  textParagraph: {
                    text: `<b>📝 Description / Instructions:</b><br>${description}`,
                  },
                },
              ],
            },
            {
              widgets: [
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'Open Task Assignments',
                        onClick: {
                          openLink: {
                            url: 'https://qa-task-portal.vercel.app/assignments',
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

    // Check if assignment notification payload
    if (body.type === 'assignment' || body.assigneeName) {
      const { assigneeName, assigneeId, assignedBy, title, description, dueDate, priority, webhookUrl } = body;
      const result = await sendAssignmentCardToGoogleChat({
        webhookUrl: webhookUrl || (await getSavedWebhookUrlAsync()),
        assigneeName: assigneeName || 'QA Member',
        assigneeId: assigneeId || 'QA',
        assignedBy: assignedBy || 'Chhayank Dave',
        title: title || 'Task Assignment',
        description: description || 'New task assigned',
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        priority: priority || 'High',
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Task assignment notification for ${assigneeName} sent to Google Chat!`,
        });
      } else {
        return NextResponse.json(
          { error: result.error || 'Failed to send assignment notification' },
          { status: 500 }
        );
      }
    }

    const { employeeName, employeeId, date, tasks, webhookUrl } = body;

    if (!employeeName || !employeeId || !date || tasks === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: employeeName, employeeId, date' },
        { status: 400 }
      );
    }

    const result = await sendCardToGoogleChat({
      webhookUrl: webhookUrl || (await getSavedWebhookUrlAsync()),
      employeeName,
      employeeId,
      date,
      tasks: Array.isArray(tasks) ? tasks : [],
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
