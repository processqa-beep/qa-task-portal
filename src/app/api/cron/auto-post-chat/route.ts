import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendCardToGoogleChat, getSavedWebhookUrlAsync } from '@/app/api/google-chat/route';
import { DailyTask, Employee } from '@/lib/types';
import { toStandardDateStr } from '@/lib/utils';

const REPORTING_QA_ENGINEERS: Employee[] = [
  { id: 'QA002', name: 'Hiren Dodiya', role: 'employee', pin: '1234', created_at: '' },
  { id: 'QA003', name: 'Purvesh Kapadiya', role: 'employee', pin: '1234', created_at: '' },
  { id: 'QA004', name: 'Mehul Chikhaliya', role: 'employee', pin: '1234', created_at: '' },
];

function getISTDateStr(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function getDirectSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createSupabaseClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const todayStr = getISTDateStr(new Date());

    // 1. Query today's tasks from Supabase
    let todayTasks: DailyTask[] = [];
    try {
      const supabase = getDirectSupabaseClient();
      const { data } = await supabase.from('daily_tasks').select('*');

      if (data && Array.isArray(data)) {
        todayTasks = data.filter((t) => toStandardDateStr(t.date || t.created_at) === todayStr);
      }
    } catch (dbErr) {
      console.warn('Cron fetch tasks error:', dbErr);
    }

    // Fallback: If direct query was empty, fetch via internal API
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

    const webhookUrl = await getSavedWebhookUrlAsync();
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      return NextResponse.json(
        { error: 'Google Chat Webhook URL is missing or invalid.' },
        { status: 400 }
      );
    }

    let postedCount = 0;
    let errors: string[] = [];

    // 2. Send report card for ALL QA members (submitted AND unsubmitted)
    for (const emp of REPORTING_QA_ENGINEERS) {
      const empTasks = todayTasks.filter(
        (t) => t.employee_id === emp.id || t.employee_id === emp.name || t.employee?.name === emp.name
      );

      const result = await sendCardToGoogleChat({
        webhookUrl,
        employeeName: emp.name,
        employeeId: emp.id,
        date: todayStr,
        tasks: empTasks.map((t) => ({
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
      return NextResponse.json({
        success: true,
        postedCards: postedCount,
        message: `Auto-posted daily team summary for ${todayStr} @ 7 PM IST to Google Chat (${postedCount} member card/s)!`,
        date: todayStr,
      });
    } else {
      return NextResponse.json(
        {
          status: 'failed',
          errors,
          message: 'Failed to post summary to Google Chat.',
        },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Cron execution error',
      },
      { status: 500 }
    );
  }
}
