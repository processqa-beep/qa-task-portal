import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DailyTask } from '@/lib/types';

// In-memory fallback tasks store for instant demo usage
const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

let MEMORY_TASKS: DailyTask[] = [
  {
    id: 'm-20',
    employee_id: 'QA001',
    date: '2026-07-20',
    work_type: 'Automation',
    task_performed: 'SG#2 dashboard: improved auto select target thickness, added min/max/avg stats, side-by-side charts | Duckdb file code for two duckdb databases with every minute dumping, moved SG#2 dashboard to 219 network PC | Updated Anneal GD vs GD Slippage trends FY 2026-27',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA001', name: 'Mehul Chikhaliya', role: 'leader', pin: '1234', created_at: '' }
  },
  {
    id: 'm-18',
    employee_id: 'QA001',
    date: '2026-07-18',
    work_type: 'Testing',
    task_performed: 'SG#2 Thickness dashboard: right/left filter, Min/Max/Avg trends, improved load time | Updated SAP production & Annealing rejection reports | Prepared QC testing equipment list | Coordinated Antistatic bar air & power connection setup',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA001', name: 'Mehul Chikhaliya', role: 'leader', pin: '1234', created_at: '' }
  },
  {
    id: 'h-18',
    employee_id: 'QA005',
    date: '2026-07-18',
    work_type: 'Testing',
    task_performed: 'Static bar electrical and pneumatic connection completed with Mr. Vipul Patel | Process audit done at ARC#6 | Electrical calibration updated in DMS portal',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA005', name: 'Hiren Dodiya', role: 'employee', pin: '1234', created_at: '' }
  },
  {
    id: 'm-17',
    employee_id: 'QA001',
    date: '2026-07-17',
    work_type: 'Testing',
    task_performed: 'Included defect photos in T-Chart for Grinding Defect excel | Thickness verification survey R3-R5 points | SG#2 Completeness System 100 NG glass check & specification adjustment (5x3mm) + password protection enabled | SG#3 Furnace Process audit check sheet shared',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA001', name: 'Mehul Chikhaliya', role: 'leader', pin: '1234', created_at: '' }
  },
  {
    id: 'h-17',
    employee_id: 'QA005',
    date: '2026-07-17',
    work_type: 'Documentation',
    task_performed: 'Prepared Procedure for Monitoring, measurement, & evaluation | Prepared Procedure for Product inspection and testing | Followed up for Static bar power connection | Logged unsafe condition | Field round oil drop observation noted',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA005', name: 'Hiren Dodiya', role: 'employee', pin: '1234', created_at: '' }
  },
  {
    id: 'm-16',
    employee_id: 'QA001',
    date: '2026-07-16',
    work_type: 'Testing',
    task_performed: 'Completeness machine photoelectric left sensor adjustment | Cloud vision thickness dashboard: improved heat map, KPI cards, filters, scatter chart | Updated Customer complaint & Module breakage reports | Thickness verification survey 5.0mm glass | Audit SG#1 Robot 2 Gripper & Frame | SG#2 Defect Inspection survey report',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA001', name: 'Mehul Chikhaliya', role: 'leader', pin: '1234', created_at: '' }
  },
  {
    id: 'h-16',
    employee_id: 'QA005',
    date: '2026-07-16',
    work_type: 'Documentation',
    task_performed: 'DMS based ISO format portal setup | Lexcare 9 pending compliance updated | Revised L2021 procedure for communication & participation | Installed Static bar stand at SG#3.2 line',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA005', name: 'Hiren Dodiya', role: 'employee', pin: '1234', created_at: '' }
  },
  {
    id: 'm-15',
    employee_id: 'QA001',
    date: '2026-07-15',
    work_type: 'Testing',
    task_performed: 'Great Place to Work survey completed | Updated Prediction report, PBI Dashboard, finished goods & WIP stock report | Process audit SG#3.1 Lehr & Cutting line | Placed Static bar in SG#3.2 ISRA cabin & coordinated workshop for stand | SG#2 Completeness System chipping glass evaluation',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA001', name: 'Mehul Chikhaliya', role: 'leader', pin: '1234', created_at: '' }
  },
  {
    id: 'h-15',
    employee_id: 'QA005',
    date: '2026-07-15',
    work_type: 'Documentation',
    task_performed: 'Prepared BRL process flow diagram for 3S solar | Prepared Objectives deployment sheet linking plant objectives to QHSE policy | Updated Objectives procedure | Process audit at SG#3.1 cutting line, Lehr, & Benteler 7 | Field round at TL#7 | RMS refractory management update',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA005', name: 'Hiren Dodiya', role: 'employee', pin: '1234', created_at: '' }
  },
  {
    id: 'm-14',
    employee_id: 'QA001',
    date: '2026-07-14',
    work_type: 'Testing',
    task_performed: 'SG#2 cloud vision thickness dashboard: auto target select, trim filter, outlier removal logic, modern UI | Updated SAP production & Annealing line rejection reports | Created Capex PR for Ribbon Completeness Detection (SG#3.1 & 3.2) | Thickness verification survey SG#2 line | Internal glass breakage data analysis',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA001', name: 'Mehul Chikhaliya', role: 'leader', pin: '1234', created_at: '' }
  },
  {
    id: 'h-14',
    employee_id: 'QA005',
    date: '2026-07-14',
    work_type: 'Other',
    task_performed: 'Great Place to Work Survey Completed | PROCEDURE FOR OBJECTIVES, TARGETS AND PROGRAMS updation | Prepare Objectives deployment | Customer feedback survey updated | 3S customer audit at Kaveri',
    status: 'Completed',
    remarks: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: { id: 'QA005', name: 'Hiren Dodiya', role: 'employee', pin: '1234', created_at: '' }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const status = searchParams.get('status');
    const workType = searchParams.get('work_type');
    const limit = searchParams.get('limit');

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

    try {
      const supabase = await createClient();
      let query = supabase
        .from('daily_tasks')
        .select('*')
        .order('date', { ascending: false });

      if (employeeId) {
        const empName = ID_NAME_MAP[employeeId] || employeeId;
        query = query.or(`employee_id.eq.${employeeId},employee_id.eq.${empName}`);
      }
      if (dateFrom) query = query.gte('date', dateFrom);
      if (dateTo) query = query.lte('date', dateTo);
      if (status) query = query.eq('status', status);
      if (workType) query = query.eq('work_type', workType);
      if (limit) query = query.limit(parseInt(limit));

      const { data, error } = await query;
      if (data && !error && data.length > 0) {
        // Fetch employees to attach metadata
        const { data: employees } = await supabase.from('employees').select('*');
        const empList = employees || [];

        const tasksWithEmployees = data.map((task) => {
          const matchedEmp = empList.find(
            (e) => e.id === task.employee_id || e.name === task.employee_id
          ) || {
            id: ID_NAME_MAP[task.employee_id] || task.employee_id,
            name: task.employee_id,
            role: 'employee',
            pin: '1234',
            created_at: '',
          };
          return {
            ...task,
            employee: matchedEmp,
          };
        });

        return NextResponse.json({ tasks: tasksWithEmployees });
      }
    } catch (dbErr) {
      console.warn('Supabase fetch tasks error, using memory store:', dbErr);
    }

    // Filter memory store
    let filtered = [...MEMORY_TASKS];
    if (employeeId) {
      const empName = ID_NAME_MAP[employeeId] || employeeId;
      filtered = filtered.filter(
        (t) => t.employee_id === employeeId || t.employee_id === empName
      );
    }
    if (dateFrom) filtered = filtered.filter((t) => t.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((t) => t.date <= dateTo);
    if (status) filtered = filtered.filter((t) => t.status === status);
    if (workType) filtered = filtered.filter((t) => t.work_type === workType);

    if (limit) filtered = filtered.slice(0, parseInt(limit));

    return NextResponse.json({ tasks: filtered });
  } catch {
    return NextResponse.json({ tasks: MEMORY_TASKS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, date, work_type, task_performed, status, remarks } = body;

    if (!employee_id || !work_type || !task_performed || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const taskDate = date || new Date().toISOString().split('T')[0];

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('daily_tasks')
        .insert({ employee_id, date: taskDate, work_type, task_performed, status, remarks: remarks || null })
        .select('*, employee:employees(*)')
        .single();

      if (data && !error) {
        return NextResponse.json({ task: data }, { status: 201 });
      }
    } catch (dbErr) {
      console.warn('Supabase task save error, saving to memory store:', dbErr);
    }

    const newTask: DailyTask = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employee_id,
      date: taskDate,
      work_type,
      task_performed,
      status,
      remarks: remarks || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    MEMORY_TASKS.unshift(newTask);
    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, work_type, task_performed, status, remarks } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    try {
      const supabase = await createClient();
      const updateData: Record<string, string | null> = {};
      if (work_type) updateData.work_type = work_type;
      if (task_performed) updateData.task_performed = task_performed;
      if (status) updateData.status = status;
      if (remarks !== undefined) updateData.remarks = remarks || null;

      const { data, error } = await supabase
        .from('daily_tasks')
        .update(updateData)
        .eq('id', id)
        .select('*, employee:employees(*)')
        .single();

      if (data && !error) {
        return NextResponse.json({ task: data });
      }
    } catch (dbErr) {
      console.warn('Supabase update task error:', dbErr);
    }

    const taskIndex = MEMORY_TASKS.findIndex(t => t.id === id);
    if (taskIndex >= 0) {
      if (work_type) MEMORY_TASKS[taskIndex].work_type = work_type;
      if (task_performed) MEMORY_TASKS[taskIndex].task_performed = task_performed;
      if (status) MEMORY_TASKS[taskIndex].status = status;
      if (remarks !== undefined) MEMORY_TASKS[taskIndex].remarks = remarks;
      return NextResponse.json({ task: MEMORY_TASKS[taskIndex] });
    }

    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    try {
      const supabase = await createClient();
      await supabase.from('daily_tasks').delete().eq('id', id);
    } catch {
      // ignore
    }

    MEMORY_TASKS = MEMORY_TASKS.filter(t => t.id !== id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
