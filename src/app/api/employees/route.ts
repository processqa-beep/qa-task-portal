import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_EMPLOYEES_LIST = [
  { id: 'QA001', name: 'Chhayank Dave', role: 'leader', avatar_url: null, created_at: new Date().toISOString() },
  { id: 'QA002', name: 'Hiren Dodiya', role: 'employee', avatar_url: null, created_at: new Date().toISOString() },
  { id: 'QA003', name: 'Purvesh Kapadiya', role: 'employee', avatar_url: null, created_at: new Date().toISOString() },
  { id: 'QA004', name: 'Mehul Chikhaliya', role: 'employee', avatar_url: null, created_at: new Date().toISOString() },
];

export async function GET() {
  try {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, role, avatar_url, created_at')
        .order('id');

      if (data && data.length > 0 && !error) {
        return NextResponse.json({ employees: data });
      }
    } catch (dbErr) {
      console.warn('Supabase fetch employees error, using demo list:', dbErr);
    }

    return NextResponse.json({ employees: DEMO_EMPLOYEES_LIST });
  } catch {
    return NextResponse.json({ employees: DEMO_EMPLOYEES_LIST });
  }
}
