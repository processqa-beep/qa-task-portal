-- ============================================
-- QA Daily Task Portal - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'leader')),
  pin TEXT NOT NULL DEFAULT '1234',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create daily_tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_type TEXT NOT NULL,
  task_performed TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Pending')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  due_date DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'High',
  status TEXT NOT NULL DEFAULT 'Assigned',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_tasks_employee_id ON daily_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON daily_tasks(status);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_employee_date ON daily_tasks(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_to ON task_assignments(assigned_to);

-- 5. Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
CREATE POLICY "Allow public read on employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow public read on daily_tasks" ON daily_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert on daily_tasks" ON daily_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on daily_tasks" ON daily_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on daily_tasks" ON daily_tasks FOR DELETE USING (true);

CREATE POLICY "Allow public read on task_assignments" ON task_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on task_assignments" ON task_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on task_assignments" ON task_assignments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on task_assignments" ON task_assignments FOR DELETE USING (true);

-- 7. Seed demo data
INSERT INTO employees (id, name, role, pin) VALUES
  ('QA001', 'Mehul Chikhaliya', 'leader', '1234'),
  ('QA002', 'Arjun Patel', 'employee', '1234'),
  ('QA003', 'Priya Sharma', 'employee', '1234'),
  ('QA004', 'Ravi Kumar', 'employee', '1234')
ON CONFLICT (id) DO NOTHING;
