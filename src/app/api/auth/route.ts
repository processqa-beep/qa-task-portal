import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo employee fallback database (ensures app works smoothly even if Supabase connection/env is pending)
const DEMO_EMPLOYEES: Record<string, { id: string; name: string; role: 'employee' | 'leader'; pin: string }> = {
  QA001: { id: 'QA001', name: 'Chhayank Dave', role: 'leader', pin: '1234' },
  QA002: { id: 'QA002', name: 'Hiren Dodiya', role: 'employee', pin: '1234' },
  QA003: { id: 'QA003', name: 'Purvesh Kapadiya', role: 'employee', pin: '1234' },
  QA004: { id: 'QA004', name: 'Mehul Chikhaliya', role: 'employee', pin: '1234' },
};

export async function POST(request: NextRequest) {
  try {
    const { employee_id, pin } = await request.json();

    if (!employee_id || !pin) {
      return NextResponse.json(
        { error: 'Employee ID and PIN are required' },
        { status: 400 }
      );
    }

    const cleanId = employee_id.trim().toUpperCase();
    const cleanPin = pin.trim();

    // Try Supabase first
    try {
      const supabase = await createClient();
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', cleanId)
        .eq('pin', cleanPin)
        .single();

      if (employee && !error) {
        const { pin: _, ...safeEmployee } = employee;
        return NextResponse.json({ employee: safeEmployee });
      }

      if (error) {
        console.warn('Supabase auth query error:', error.message);
      }
    } catch (dbErr) {
      console.warn('Supabase client error, falling back to demo auth:', dbErr);
    }

    // Fallback: Check DEMO_EMPLOYEES array
    const demoUser = DEMO_EMPLOYEES[cleanId];
    if (demoUser && demoUser.pin === cleanPin) {
      const { pin: _, ...safeEmployee } = demoUser;
      return NextResponse.json({ employee: safeEmployee });
    }

    return NextResponse.json(
      { error: 'Invalid Employee ID or PIN' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
