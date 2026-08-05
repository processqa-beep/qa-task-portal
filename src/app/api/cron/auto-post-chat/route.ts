import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendCardToGoogleChat, hasDateBeenPosted, markDateAsPosted, getSavedWebhookUrlAsync } from '@/app/api/google-chat/route';
import { DailyTask } from '@/lib/types';

const ID_NAME_MAP: Record<string, string> = {
  QA001: 'Chhayank Dave',
  QA002: 'Hiren Dodiya',
  QA003: 'Purvesh Kapadiya',
  QA004: 'Mehul Chikhaliya',
  'Chhayank Dave': 'QA001',
  'Hiren Dodiya': 'QA002',
  'Purvesh Kapadiya': 'QA003',
  'Mehul Chikhaliya': 'QA004',
};

function getISTDateStr(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export async function GET(request: NextRequest) {
  try {
    const todayStr = getISTDateStr(new Date());
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // 1. If already posted today and not forced, exit safely
    if (hasDateBeenPosted(todayStr) && !force) {
      return NextResponse.json({
        status: 'already_posted',
        message: `Daily report for ${todayStr} has already been posted to Google Chat.`,
        date: todayStr,
      });
    }

    // 2. Query today's tasks from Supabase
    let todayTasks: DailyTask[] = [];
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('daily_tasks')
        .select('*, employee:employees(*)')
        .gte('date', todayStr)
        .lte('date', `${todayStr}T23:59:59.999Z`);

      if (data && Array.isArray(data)) {
        todayTasks = data;
      }
    } catch (dbErr) {
      console.warn('Cron fetch tasks error:', dbErr);
    }

    // If direct query was empty, fallback to fetch internal tasks
    if (todayTasks.length === 0) {
      try {
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const res = await fetch(`${protocol}://${host}/api/tasks?date_from=${todayStr}&date_to=${todayStr}`);
        if (res.ok) {
          const json = await res.json();
          if (json.tasks && Array.isArray(json.tasks)) {
            todayTasks = json.tasks;
          }
        }
      } catch {
        // ignore
      }
    }

    if (todayTasks.length === 0) {
      return NextResponse.json({
        status: 'no_tasks_submitted',
        message: `No tasks submitted for ${todayStr} yet. Auto-post skipped.`,
        date: todayStr,
      });
    }

    // 3. Group today's tasks by QA member
    const memberTasksMap = new Map<string, { empName: string; empId: string; tasks: DailyTask[] }>();

    todayTasks.forEach((t) => {
      const rawEmp = t.employee_id || t.employee?.id || 'QA004';
      const empId = ID_NAME_MAP[rawEmp] ? (rawEmp.startsWith('QA') ? rawEmp : ID_NAME_MAP[rawEmp]) : rawEmp;
      const empName = t.employee?.name || (ID_NAME_MAP[empId] || empId);

      const key = empId;
      if (!memberTasksMap.has(key)) {
        memberTasksMap.set(key, { empName, empId, tasks: [] });
      }
      memberTasksMap.get(key)!.tasks.push(t);
    });

    const webhookUrl = await getSavedWebhookUrlAsync();

    let postedCount = 0;
    let errors: string[] = [];

    // 4. Send report card for each QA member who submitted tasks today
    for (const group of Array.from(memberTasksMap.values())) {
      const result = await sendCardToGoogleChat({
        webhookUrl,
        employeeName: group.empName,
        employeeId: group.empId,
        date: todayStr,
        tasks: group.tasks.map((t) => ({
          work_type: t.work_type,
          task_performed: t.task_performed,
          status: t.status,
          remarks: t.remarks,
        })),
      });

      if (result.success) {
        postedCount++;
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    if (postedCount > 0) {
      markDateAsPosted(todayStr);
      return NextResponse.json({
        success: true,
        postedCards: postedCount,
        message: `Auto-posted daily summary for ${todayStr} @ 7 PM IST to Google Chat!`,
        date: todayStr,
      });
    } else {
      return NextResponse.json({
        status: 'failed',
        errors,
        message: 'Failed to post summary to Google Chat.',
      }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Cron execution error',
    }, { status: 500 });
  }
}
