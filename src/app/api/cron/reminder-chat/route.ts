import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSavedWebhookUrlAsync } from '@/app/api/google-chat/route';
import { DailyTask, Employee } from '@/lib/types';

const REPORTING_QA_ENGINEERS: Employee[] = [
  { id: 'QA002', name: 'Hiren Dodiya', role: 'employee', pin: '1234', created_at: '' },
  { id: 'QA003', name: 'Purvesh Kapadiya', role: 'employee', pin: '1234', created_at: '' },
  { id: 'QA004', name: 'Mehul Chikhaliya', role: 'employee', pin: '1234', created_at: '' },
];

const REMINDER_SENT_DATES = new Set<string>();

function getISTDateStr(date: Date = new Date()): string {
  // Returns YYYY-MM-DD in India Standard Time
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    // Evaluate day of week in Asia/Kolkata timezone
    const istDayStr = now.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' });
    const isWeekend = istDayStr === 'Sat' || istDayStr === 'Sun';

    const todayStr = getISTDateStr(now);
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // 1. Disable reminders on Saturday and Sunday (unless forced for testing)
    if (isWeekend && !force) {
      return NextResponse.json({
        status: 'weekend_disabled',
        message: 'Daily task reminders are disabled on Saturday and Sunday.',
        date: todayStr,
        dayOfWeek: istDayStr,
      });
    }

    // 2. Prevent duplicate reminders on the same calendar day (unless forced)
    if (REMINDER_SENT_DATES.has(todayStr) && !force) {
      return NextResponse.json({
        status: 'already_sent_today',
        message: `5 PM reminder for ${todayStr} has already been sent to Google Chat.`,
        date: todayStr,
      });
    }

    // 3. Query today's tasks from Supabase
    let todayTasks: DailyTask[] = [];
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('daily_tasks')
        .select('*')
        .gte('date', todayStr)
        .lte('date', `${todayStr}T23:59:59.999Z`);

      if (data && Array.isArray(data)) {
        todayTasks = data;
      }
    } catch (dbErr) {
      console.warn('Reminder cron fetch tasks error:', dbErr);
    }

    // 4. Identify members who have NOT submitted today's task report
    const pendingMembers = REPORTING_QA_ENGINEERS.filter((emp) => {
      return !todayTasks.some(
        (t) => t.employee_id === emp.id || t.employee_id === emp.name || t.employee?.name === emp.name
      );
    });

    if (pendingMembers.length === 0 && !force) {
      return NextResponse.json({
        status: 'all_submitted',
        message: `All QA members have already submitted their daily task reports for ${todayStr}. No reminder needed.`,
        date: todayStr,
      });
    }

    const membersToRemind = pendingMembers.length > 0 ? pendingMembers : REPORTING_QA_ENGINEERS;

    // 5. Retrieve active Webhook URL from Supabase / memory / env
    const targetWebhookUrl = await getSavedWebhookUrlAsync();

    if (!targetWebhookUrl) {
      return NextResponse.json(
        { error: 'Google Chat Webhook URL is not configured.' },
        { status: 400 }
      );
    }

    const niceDate = new Date(todayStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const pendingListText = membersToRemind
      .map((m, idx) => `<b>${idx + 1}.</b> ${m.name} (${m.id})`)
      .join('<br>');

    const cardPayload = {
      cardsV2: [
        {
          cardId: `qa-reminder-5pm-${todayStr}-${Date.now()}`,
          card: {
            header: {
              title: '⏰ QA Daily Task Report Reminder',
              subtitle: `📅 ${niceDate} · 5:00 PM Daily Check`,
              imageUrl: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
              imageType: 'CIRCLE',
            },
            sections: [
              {
                widgets: [
                  {
                    textParagraph: {
                      text: `<b>Good Evening QA Team! 👋</b><br><br>This is a friendly 5:00 PM reminder to update your daily activity report on the QA Task Portal.<br><br><font color="#dc2626"><b>Pending Submissions (${membersToRemind.length}):</b></font><br>${pendingListText}`,
                    },
                  },
                  {
                    textParagraph: {
                      text: `Please submit your daily tasks before the end of your shift:<br>👉 <a href="https://qa-task-portal.vercel.app/submit"><b>Click here to Submit Task on Portal</b></a>`,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    // 6. Send reminder card via Google Chat Webhook API
    const googleRes = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(cardPayload),
    });

    if (googleRes.ok) {
      REMINDER_SENT_DATES.add(todayStr);
      return NextResponse.json({
        success: true,
        pendingCount: membersToRemind.length,
        pendingMembers: membersToRemind.map((m) => m.name),
        message: `Sent 5 PM reminder to Google Chat for ${membersToRemind.length} QA member(s).`,
        date: todayStr,
      });
    } else {
      const errText = await googleRes.text();
      return NextResponse.json(
        { error: `Google Chat returned error: ${errText}` },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cron reminder error' },
      { status: 500 }
    );
  }
}
