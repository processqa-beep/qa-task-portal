import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ImpactEntry {
  id: string;
  taskTitle: string;
  category: string;
  impactLevel: string;
  description: string;
  measurableResult: string;
  assignee: string;
  date: string;
}

const INITIAL_IMPACTS: ImpactEntry[] = [
  { id:'1', taskTitle:'Kaveri 3S Customer Audit', category:'Compliance', impactLevel:'Critical',
    description:'Completed full customer audit at Kaveri plant with zero critical deviations found.',
    measurableResult:'100% compliance rate, 0 NCRs raised', assignee:'Hiren Dodiya', date:'2026-07-21' },
  { id:'2', taskTitle:'DuckDB Automation Pipeline', category:'Automation', impactLevel:'High',
    description:'Automated thickness measurement log pipeline, reducing manual reporting by 3 hours/day.',
    measurableResult:'3 hrs/day saved, 100% data accuracy', assignee:'Mehul Chikhaliya', date:'2026-07-20' },
  { id:'3', taskTitle:'Cloud Vision Dashboard Optimization', category:'Quality', impactLevel:'High',
    description:'Designed comparative charts for glass width deviation tracking across Kaveri tempering line.',
    measurableResult:'Deviation detection improved by 40%', assignee:'Mehul Chikhaliya', date:'2026-07-19' },
  { id:'4', taskTitle:'Plant Layout & DMS Objectives', category:'Process', impactLevel:'Medium',
    description:'Prepared comprehensive Plant Objectives Deployment matrices linked to QHSE standards.',
    measurableResult:'12 objectives mapped, 3 plant sections covered', assignee:'Purvesh Kapadiya', date:'2026-07-18' },
  { id:'5', taskTitle:'Anti-static Bar Bug Fix – SG#3.2', category:'Quality', impactLevel:'High',
    description:'Resolved static anti-static bar functionality bugs in Kaveri tempering line.',
    measurableResult:'Dust spot defects reduced by 60%', assignee:'Purvesh Kapadiya', date:'2026-07-17' },
  { id:'6', taskTitle:'IMS Documentation Update', category:'Compliance', impactLevel:'Medium',
    description:'Updated IMS documentation to reflect latest process changes and audit findings.',
    measurableResult:'15 documents updated, 100% traceability', assignee:'Hiren Dodiya', date:'2026-07-16' },
];

let MEMORY_IMPACTS: ImpactEntry[] = [...INITIAL_IMPACTS];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ceo_impacts')
      .select('*')
      .order('date', { ascending: false });

    if (data && !error && data.length > 0) {
      MEMORY_IMPACTS = data;
      return NextResponse.json({ impacts: data });
    }

    if (data && data.length === 0) {
      // Seed initial entries into Supabase table
      try {
        await supabase.from('ceo_impacts').insert(INITIAL_IMPACTS);
        return NextResponse.json({ impacts: INITIAL_IMPACTS });
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn('Supabase fetch ceo_impacts error:', err);
  }

  return NextResponse.json({ impacts: MEMORY_IMPACTS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskTitle, category, impactLevel, description, measurableResult, assignee, date } = body;

    if (!taskTitle || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newEntry: ImpactEntry = {
      id: body.id || `imp-${Date.now()}`,
      taskTitle: taskTitle.trim(),
      category: category || 'Quality',
      impactLevel: impactLevel || 'High',
      description: description.trim(),
      measurableResult: measurableResult || '',
      assignee: assignee || 'Mehul Chikhaliya',
      date: date || new Date().toISOString().split('T')[0],
    };

    try {
      const supabase = await createClient();
      await supabase.from('ceo_impacts').insert(newEntry);
    } catch (err) {
      console.warn('Supabase insert ceo_impact error:', err);
    }

    MEMORY_IMPACTS = [newEntry, ...MEMORY_IMPACTS.filter((i) => i.id !== newEntry.id)];
    return NextResponse.json({ impact: newEntry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
      const supabase = await createClient();
      await supabase.from('ceo_impacts').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete ceo_impact error:', err);
    }

    MEMORY_IMPACTS = MEMORY_IMPACTS.filter((i) => i.id !== id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
