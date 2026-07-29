import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssignedTask, Employee } from '@/lib/types';

const REPORTING_ENGINEERS: Employee[] = [
  { id: 'QA002', name: 'Hiren Dodiya', role: 'employee' as const, pin: '1234', created_at: '' },
  { id: 'QA003', name: 'Purvesh Kapadiya', role: 'employee' as const, pin: '1234', created_at: '' },
  { id: 'QA004', name: 'Mehul Chikhaliya', role: 'employee' as const, pin: '1234', created_at: '' },
];

let SERVER_ASSIGNMENTS_CACHE: AssignedTask[] | null = null;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const mapped: AssignedTask[] = data.map((t) => ({
        ...t,
        assignee: REPORTING_ENGINEERS.find((e) => e.id === t.assigned_to) || {
          id: t.assigned_to,
          name: t.assigned_to,
          role: 'employee',
          pin: '1234',
          created_at: '',
        },
      }));
      SERVER_ASSIGNMENTS_CACHE = mapped;
      return NextResponse.json({ assignments: mapped });
    }
  } catch (err) {
    console.warn('Supabase fetch task_assignments error:', err);
  }

  return NextResponse.json({ assignments: SERVER_ASSIGNMENTS_CACHE || [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, assigned_to, assigned_by, due_date, priority } = body;

    if (!title || !description || !assigned_to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assigneeObj = REPORTING_ENGINEERS.find((e) => e.id === assigned_to);
    const id = body.id || `asgn-${Date.now()}`;

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

    // Save directly to Supabase table
    try {
      const supabase = await createClient();
      await supabase.from('task_assignments').insert({
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

    if (!SERVER_ASSIGNMENTS_CACHE) SERVER_ASSIGNMENTS_CACHE = [];
    SERVER_ASSIGNMENTS_CACHE = [newTask, ...SERVER_ASSIGNMENTS_CACHE.filter((a) => a.id !== id)];

    return NextResponse.json({ assignment: newTask }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 });
    }

    // Update directly in Supabase
    try {
      const supabase = await createClient();
      await supabase.from('task_assignments').update({ status }).eq('id', id);
    } catch (err) {
      console.warn('Supabase update assignment error:', err);
    }

    if (SERVER_ASSIGNMENTS_CACHE) {
      SERVER_ASSIGNMENTS_CACHE = SERVER_ASSIGNMENTS_CACHE.map((a) =>
        a.id === id ? { ...a, status } : a
      );
    }

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

    const supabase = await createClient();

    if (deleteAllOld === 'true') {
      try {
        await supabase.from('task_assignments').delete().eq('status', 'Completed');
      } catch (err) {
        console.warn('Supabase delete completed assignments error:', err);
      }
      if (SERVER_ASSIGNMENTS_CACHE) {
        SERVER_ASSIGNMENTS_CACHE = SERVER_ASSIGNMENTS_CACHE.filter((a) => a.status !== 'Completed');
      }
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

    if (SERVER_ASSIGNMENTS_CACHE) {
      SERVER_ASSIGNMENTS_CACHE = SERVER_ASSIGNMENTS_CACHE.filter((a) => a.id !== id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
