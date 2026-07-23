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

    // Format all tasks into a single clean Google Chat card message
    const formattedTaskWidgets = tasks.map((t, idx) => {
      const statusEmoji = t.status === 'Completed' ? '✅' : '⏳';
      const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][idx] || `[${idx + 1}]`;

      let text = `${numEmoji} <b>[${t.work_type}]</b> ${statusEmoji} <i>${t.status}</i><br>`;
      text += `${t.task_performed.replace(/\n/g, '<br>')}`;
      if (t.remarks) {
        text += `<br><font color="#666666"><i>Note: ${t.remarks}</i></font>`;
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
              title: `📋 QA Daily Report Submitted`,
              subtitle: `${employeeName} (${employeeId}) · ${date}`,
              imageUrl: 'https://cdn-icons-png.flaticon.com/512/906/906343.png',
              imageType: 'CIRCLE',
            },
            sections: [
              {
                header: `<b>Today's Submitted Tasks (${tasks.length})</b>`,
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
