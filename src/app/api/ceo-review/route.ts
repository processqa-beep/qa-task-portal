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

let SERVER_IMPACTS_CACHE: ImpactEntry[] | null = null;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ceo_impacts')
      .select('*')
      .order('date', { ascending: false });

    if (data && !error) {
      SERVER_IMPACTS_CACHE = data;
      return NextResponse.json({ impacts: data });
    }
  } catch (err) {
    console.warn('Supabase fetch ceo_impacts error:', err);
  }

  return NextResponse.json({ impacts: SERVER_IMPACTS_CACHE || [] });
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

    if (!SERVER_IMPACTS_CACHE) SERVER_IMPACTS_CACHE = [];
    SERVER_IMPACTS_CACHE = [newEntry, ...SERVER_IMPACTS_CACHE.filter((i) => i.id !== newEntry.id)];

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

    if (SERVER_IMPACTS_CACHE) {
      SERVER_IMPACTS_CACHE = SERVER_IMPACTS_CACHE.filter((i) => i.id !== id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
