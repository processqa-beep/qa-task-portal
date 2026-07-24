import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const body: NotificationBody = await request.json();
    const { webhookUrl, employeeName, employeeId, date, tasks } = body;

    // Use passed webhookUrl or server env variable
    const targetWebhookUrl =
      webhookUrl ||
      process.env.GOOGLE_CHAT_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_GOOGLE_CHAT_WEBHOOK_URL;

    if (!targetWebhookUrl) {
      return NextResponse.json(
        { error: 'Google Chat Webhook URL is not configured. Please save your Webhook URL.' },
        { status: 400 }
      );
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks provided to send' },
        { status: 400 }
      );
    }

    const niceDate = formatDateNice(date);

    // Format all tasks with serial numbers & colorful work types:
    // "1. DEVLOPMENT: Task details..."
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

    // Server-to-server POST (No CORS restrictions)
    const googleRes = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(cardPayload),
    });

    if (googleRes.ok) {
      return NextResponse.json({ success: true, count: tasks.length });
    } else {
      const errText = await googleRes.text();
      console.error('Google Chat API error:', errText);
      return NextResponse.json(
        { error: `Google Chat returned error: ${errText}` },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('Error in Google Chat API route:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
