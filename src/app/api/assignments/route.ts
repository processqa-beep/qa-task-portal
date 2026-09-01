import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendAssignmentCardToGoogleChat, saveWebhookUrlToDatabase, getSavedWebhookUrlAsync } from '@/app/api/google-chat/route';
import { AssignedTask, Employee } from '@/lib/types';
import crypto from 'crypto';

const REPORTING_ENGINEERS: Employee[] = [
  { id: 'QA002', name: 'Hiren Dodiya', role: 'employee' as const, pin: '1234', created_at: '' },
  { id: 'QA003', name: 'Purvesh Kapadiya', role: 'employee' as const, pin: '1234', created_at: '' },
  { id: 'QA004', name: 'Mehul Chikhaliya', role: 'employee' as const, pin: '1234', created_at: '' },
];

function getDirectSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzeohmmjcdzzjoqanggi.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_uiHQCxkly03-n0dVnye5kw_9l9ng59N';
  return createSupabaseClient(url, key);
}

let SERVER_ASSIGNMENTS_CACHE: AssignedTask[] = [];

export async function GET() {
  try {
    const supabase = getDirectSupabaseClient();
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .like('task_performed', '[TASK_ASSIGNMENT]%')
      .order('created_at', { ascending: false });

    if (data && !error && Array.isArray(data)) {
      const parsedTasks: AssignedTask[] = [];
      for (const row of data) {
        try {
          const jsonStr = (row.task_performed || '').replace('[TASK_ASSIGNMENT] ', '').trim();
          if (jsonStr.startsWith('{')) {
            const taskObj = JSON.parse(jsonStr);
            const assigneeObj = REPORTING_ENGINEERS.find((e) => e.id === taskObj.assigned_to) || {
              id: taskObj.assigned_to,
              name: taskObj.assigned_to,
              role: 'employee',
              pin: '1234',
              created_at: '',
            };
            parsedTasks.push({
              ...taskObj,
              db_uuid: row.id,
              assignee: assigneeObj,
            });
          }
        } catch {
          // ignore corrupted json
        }
      }

      SERVER_ASSIGNMENTS_CACHE = parsedTasks;
      return NextResponse.json({ assignments: parsedTasks });
    }
  } catch (err) {
    console.warn('Supabase fetch assignments error:', err);
  }

  return NextResponse.json({ assignments: SERVER_ASSIGNMENTS_CACHE || [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, assigned_to, assigned_by, due_date, priority, webhookUrl } = body;

    if (!title || !description || !assigned_to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (webhookUrl && String(webhookUrl).trim().startsWith('http')) {
      await saveWebhookUrlToDatabase(String(webhookUrl).trim());
    }

    const assigneeObj = REPORTING_ENGINEERS.find((e) => e.id === assigned_to);
    const id = body.id || `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const dbUuid = crypto.randomUUID();

    const newTask: AssignedTask = {
      id,
      title: title.trim(),
      description: description.trim(),
      assigned_to,
      assigned_by: assigned_by || 'Chhayank Dave (QA001)',
      due_date: due_date || new Date().toISOString().split('T')[0],
      priority: priority || 'High',
      status: 'Assigned',
      created_at: new Date().toISOString(),
      assignee: assigneeObj,
    };

    // 1. Direct Supabase PostgreSQL Insert
    try {
      const supabase = getDirectSupabaseClient();
      const taskPerformedPayload = `[TASK_ASSIGNMENT] ${JSON.stringify(newTask)}`;
      await supabase.from('daily_tasks').insert({
        id: dbUuid,
        employee_id: newTask.assigned_to,
        date: newTask.due_date,
        work_type: 'Other',
        task_performed: taskPerformedPayload,
        status: 'Pending',
        remarks: `Task Assignment: ${newTask.id}`,
      });
    } catch (err) {
      console.warn('Supabase insert assignment error:', err);
    }

    // 2. In-memory update
    SERVER_ASSIGNMENTS_CACHE = [newTask, ...SERVER_ASSIGNMENTS_CACHE.filter((a) => a.id !== id)];

    // 3. Send automated Google Chat notification card with complete assignment details
    try {
      const activeWebhook = webhookUrl || (await getSavedWebhookUrlAsync());
      await sendAssignmentCardToGoogleChat({
        webhookUrl: activeWebhook,
        assigneeName: assigneeObj?.name || assigned_to,
        assigneeId: assigned_to,
        assignedBy: newTask.assigned_by,
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.due_date,
        priority: newTask.priority,
      });
    } catch (chatErr) {
      console.warn('Failed to send assignment Google Chat notification:', chatErr);
    }

    return NextResponse.json({ assignment: newTask, success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create assignment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 });
    }

    // 1. Find and update in Supabase
    try {
      const supabase = getDirectSupabaseClient();
      const { data: rows } = await supabase
        .from('daily_tasks')
        .select('*')
        .like('task_performed', `%${id}%`);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          try {
            const jsonStr = (row.task_performed || '').replace('[TASK_ASSIGNMENT] ', '').trim();
            const taskObj = JSON.parse(jsonStr);
            taskObj.status = status;

            await supabase
              .from('daily_tasks')
              .update({
                task_performed: `[TASK_ASSIGNMENT] ${JSON.stringify(taskObj)}`,
                status: status === 'Completed' ? 'Completed' : 'Pending',
              })
              .eq('id', row.id);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.warn('Supabase update assignment error:', err);
    }

    SERVER_ASSIGNMENTS_CACHE = SERVER_ASSIGNMENTS_CACHE.map((a) =>
      a.id === id ? { ...a, status } : a
    );

    return NextResponse.json({ success: true, id, status });
  } catch {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAllOld = searchParams.get('deleteAllOld');

    const supabase = getDirectSupabaseClient();

    if (deleteAllOld === 'true') {
      try {
        const { data: rows } = await supabase
          .from('daily_tasks')
          .select('*')
          .like('task_performed', '[TASK_ASSIGNMENT]%');

        if (rows && rows.length > 0) {
          for (const row of rows) {
            try {
              const jsonStr = (row.task_performed || '').replace('[TASK_ASSIGNMENT] ', '').trim();
              const taskObj = JSON.parse(jsonStr);
              if (taskObj.status === 'Completed') {
                await supabase.from('daily_tasks').delete().eq('id', row.id);
              }
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.warn('Supabase delete completed assignments error:', err);
      }
      SERVER_ASSIGNMENTS_CACHE = SERVER_ASSIGNMENTS_CACHE.filter((a) => a.status !== 'Completed');
      return NextResponse.json({ success: true, message: 'All completed tasks deleted' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    try {
      const { data: rows } = await supabase
        .from('daily_tasks')
        .select('id')
        .like('task_performed', `%${id}%`);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          await supabase.from('daily_tasks').delete().eq('id', row.id);
        }
      }
    } catch (err) {
      console.warn('Supabase delete assignment error:', err);
    }

    SERVER_ASSIGNMENTS_CACHE = SERVER_ASSIGNMENTS_CACHE.filter((a) => a.id !== id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
