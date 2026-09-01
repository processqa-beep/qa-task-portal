import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendAssignmentCardToGoogleChat, saveWebhookUrlToDatabase, getSavedWebhookUrlAsync } from '@/app/api/google-chat/route';
import { AssignedTask, Employee } from '@/lib/types';

const REPORTING_ENGINEERS: Employee[] = [
  { id: 'QA002', name: 'Hiren Dodiya', role: 'employee' as const, pin: '1234', created_at: '' },
  { id: 'QA003', name: 'Purvesh Kapadiya', role: 'employee' as const, pin: '1234', created_at: '' },
  { id: 'QA004', name: 'Mehul Chikhaliya', role: 'employee' as const, pin: '1234', created_at: '' },
];

function getDirectSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzeohmmjcdzzjoqanggi.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createSupabaseClient(url, key);
}

let SERVER_ASSIGNMENTS_CACHE: AssignedTask[] = [];

async function syncBackupToSystemSettings(tasks: AssignedTask[]) {
  try {
    const supabase = getDirectSupabaseClient();
    await supabase.from('system_settings').upsert({
      key: 'task_assignments_backup',
      value: JSON.stringify(tasks),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Backup sync to system_settings error:', err);
  }
}

async function loadBackupFromSystemSettings(): Promise<AssignedTask[]> {
  try {
    const supabase = getDirectSupabaseClient();
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'task_assignments_backup')
      .maybeSingle();

    if (data && data.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export async function GET() {
  let dbTasks: AssignedTask[] = [];

  // 1. Try fetching from Supabase table task_assignments
  try {
    const supabase = getDirectSupabaseClient();
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error && Array.isArray(data) && data.length > 0) {
      dbTasks = data.map((t) => ({
        ...t,
        assignee: REPORTING_ENGINEERS.find((e) => e.id === t.assigned_to) || {
          id: t.assigned_to,
          name: t.assigned_to,
          role: 'employee',
          pin: '1234',
          created_at: '',
        },
      }));
      SERVER_ASSIGNMENTS_CACHE = dbTasks;
      return NextResponse.json({ assignments: dbTasks });
    }
  } catch (err) {
    console.warn('Supabase fetch task_assignments error:', err);
  }

  // 2. Fallback to system_settings backup key
  const backup = await loadBackupFromSystemSettings();
  if (backup.length > 0) {
    SERVER_ASSIGNMENTS_CACHE = backup;
    return NextResponse.json({ assignments: backup });
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

    // Save webhook if provided
    if (webhookUrl && String(webhookUrl).trim().startsWith('http')) {
      await saveWebhookUrlToDatabase(String(webhookUrl).trim());
    }

    const assigneeObj = REPORTING_ENGINEERS.find((e) => e.id === assigned_to);
    const id = body.id || `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

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

    // 1. Save directly to Supabase table task_assignments
    try {
      const supabase = getDirectSupabaseClient();
      await supabase.from('task_assignments').upsert({
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        assigned_to: newTask.assigned_to,
        assigned_by: newTask.assigned_by,
        due_date: newTask.due_date,
        priority: newTask.priority,
        status: newTask.status,
        created_at: newTask.created_at,
      });
    } catch (err) {
      console.warn('Supabase insert assignment error:', err);
    }

    // 2. Dual persistence to system_settings backup
    const existingBackup = await loadBackupFromSystemSettings();
    const mergedList = [newTask, ...existingBackup.filter((a) => a.id !== id)];
    SERVER_ASSIGNMENTS_CACHE = mergedList;
    await syncBackupToSystemSettings(mergedList);

    // 3. Send automated Google Chat notification card with complete assignment details
    try {
      const activeWebhook = webhookUrl || (await getSavedWebhookUrlAsync());
      const chatRes = await sendAssignmentCardToGoogleChat({
        webhookUrl: activeWebhook,
        assigneeName: assigneeObj?.name || assigned_to,
        assigneeId: assigned_to,
        assignedBy: newTask.assigned_by,
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.due_date,
        priority: newTask.priority,
      });
      if (!chatRes.success) {
        console.warn('Google Chat notification returned warning:', chatRes.error);
      }
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

    // 1. Update directly in Supabase table
    try {
      const supabase = getDirectSupabaseClient();
      await supabase.from('task_assignments').update({ status }).eq('id', id);
    } catch (err) {
      console.warn('Supabase update assignment error:', err);
    }

    // 2. Update system_settings backup
    const existingBackup = await loadBackupFromSystemSettings();
    const updatedBackup = existingBackup.map((a) => (a.id === id ? { ...a, status } : a));
    SERVER_ASSIGNMENTS_CACHE = updatedBackup;
    await syncBackupToSystemSettings(updatedBackup);

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
        await supabase.from('task_assignments').delete().eq('status', 'Completed');
      } catch (err) {
        console.warn('Supabase delete completed assignments error:', err);
      }
      const existingBackup = await loadBackupFromSystemSettings();
      const filtered = existingBackup.filter((a) => a.status !== 'Completed');
      SERVER_ASSIGNMENTS_CACHE = filtered;
      await syncBackupToSystemSettings(filtered);
      return NextResponse.json({ success: true, message: 'All completed tasks deleted' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    try {
      await supabase.from('task_assignments').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete assignment error:', err);
    }

    const existingBackup = await loadBackupFromSystemSettings();
    const filtered = existingBackup.filter((a) => a.id !== id);
    SERVER_ASSIGNMENTS_CACHE = filtered;
    await syncBackupToSystemSettings(filtered);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
