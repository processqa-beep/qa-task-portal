import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WORK_TYPES } from '@/lib/constants';

let DYNAMIC_WORK_TYPES_CACHE = [...WORK_TYPES];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('daily_tasks')
      .select('work_type');

    if (data && Array.isArray(data)) {
      const dbTypes = data.map((t) => t.work_type).filter(Boolean);
      const combined = Array.from(new Set([...WORK_TYPES, ...dbTypes]));
      DYNAMIC_WORK_TYPES_CACHE = combined;
      return NextResponse.json({ workTypes: combined });
    }
  } catch (err) {
    console.warn('Supabase work types fetch error:', err);
  }

  return NextResponse.json({ workTypes: DYNAMIC_WORK_TYPES_CACHE });
}
