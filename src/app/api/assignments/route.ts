import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssignedTask, Employee } from '@/lib/types';

const REPORTING_ENGINEERS: Employee[] = [
  { id: 'QA002', name: 'Hiren Dodiya', role: 'employee' as const, pin: '1234', created_at: '' },
  { id: 'QA003', name: 'Purvesh Kapadiya', role: 'employee' as const, pin: '1234', created_at: '' },
  { id: 'QA004', name: 'Mehul Chikhaliya', role: 'employee' as const, pin: '1234', created_at: '' },
];

// Seed assignments for initial setup if Supabase table is empty
const INITIAL_SEED_ASSIGNMENTS: AssignedTask[] = [
  {
    id: 'asgn-1',
    title: 'Process Audit at TL#7 Conveyor & Tempering Line',
    description: 'Verify SOP display versions behind benteler 7, check oil leakage from conveyor motor, inspect fire hose key.',
    assigned_to: 'QA002',
    assigned_by: 'Chhayank Dave (QA001)',
    due_date: '2026-07-22',
    priority: 'High',
    status: 'In Progress',
    created_at: '2026-07-20T09:00:00Z',
    assignee: REPORTING_ENGINEERS[0],
  },
  {
    id: 'asgn-2',
    title: 'SG#2 Cloud Vision Thickness Dashboard DuckDB Optimization',
    description: 'Move Duckdb data dumping to 219 network PC and add side-by-side glass thickness comparison charts.',
    assigned_to: 'QA004',
    assigned_by: 'Chhayank Dave (QA001)',
    due_date: '2026-07-21',
    priority: 'High',
    status: 'Completed',
    created_at: '2026-07-19T10:30:00Z',
    assignee: REPORTING_ENGINEERS[2],
  },
  {
    id: 'asgn-3',
    title: 'ISO DMS Compliance Verification & Documentation',
    description: 'Verify all 9 Lexcare pending compliance items and update printable PDF standard formats across plant.',
    assigned_to: 'QA003',
    assigned_by: 'Chhayank Dave (QA001)',
    due_date: '2026-07-23',
    priority: 'Medium',
    status: 'Assigned',
    created_at: '2026-07-21T08:00:00Z',
    assignee: REPORTING_ENGINEERS[1],
  },
];

let SERVER_ASSIGNMENTS_CACHE: AssignedTask[] = [...INITIAL_SEED_ASSIGNMENTS];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error && data.length > 0) {
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

    // If Supabase table is empty or missing, seed initial assignments into Supabase
    if (data && data.length === 0) {
      try {
        await supabase.from('task_assignments').insert(
          INITIAL_SEED_ASSIGNMENTS.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            assigned_to: a.assigned_to,
            assigned_by: a.assigned_by,
            due_date: a.due_date,
            priority: a.priority,
            status: a.status,
            created_at: a.created_at,
          }))
        );
        return NextResponse.json({ assignments: INITIAL_SEED_ASSIGNMENTS });
      } catch {
        // ignore
      }
    }
  } catch {
    // Fallback to server memory cache
  }

  return NextResponse.json({ assignments: SERVER_ASSIGNMENTS_CACHE });
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

    // Update server cache
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

    SERVER_ASSIGNMENTS_CACHE = SERVER_ASSIGNMENTS_CACHE.map((a) =>
      a.id === id ? { ...a, status } : a
    );

    const updatedTask = SERVER_ASSIGNMENTS_CACHE.find((a) => a.id === id);
    return NextResponse.json({ assignment: updatedTask });
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
      SERVER_ASSIGNMENTS_CACHE = SERVER_ASSIGNMENTS_CACHE.filter((a) => a.status !== 'Completed');
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

    SERVER_ASSIGNMENTS_CACHE = SERVER_ASSIGNMENTS_CACHE.filter((a) => a.id !== id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
