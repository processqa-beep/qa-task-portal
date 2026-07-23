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

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_tasks_employee_id ON daily_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON daily_tasks(status);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_employee_date ON daily_tasks(employee_id, date);

-- 4. Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Allow anyone to read employees (needed for login)
CREATE POLICY "Allow public read on employees" ON employees
  FOR SELECT USING (true);

-- Allow anyone to read daily_tasks (auth handled at app level)
CREATE POLICY "Allow public read on daily_tasks" ON daily_tasks
  FOR SELECT USING (true);

-- Allow anyone to insert daily_tasks
CREATE POLICY "Allow public insert on daily_tasks" ON daily_tasks
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update daily_tasks
CREATE POLICY "Allow public update on daily_tasks" ON daily_tasks
  FOR UPDATE USING (true);

-- Allow anyone to delete daily_tasks
CREATE POLICY "Allow public delete on daily_tasks" ON daily_tasks
  FOR DELETE USING (true);

-- 6. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_tasks_updated_at
  BEFORE UPDATE ON daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Seed demo data
INSERT INTO employees (id, name, role, pin) VALUES
  ('QA001', 'Mehul Chikhaliya', 'leader', '1234'),
  ('QA002', 'Arjun Patel', 'employee', '1234'),
  ('QA003', 'Priya Sharma', 'employee', '1234'),
  ('QA004', 'Ravi Kumar', 'employee', '1234')
ON CONFLICT (id) DO NOTHING;

-- 8. Seed sample tasks for demo
INSERT INTO daily_tasks (employee_id, date, work_type, task_performed, status, remarks) VALUES
  ('QA001', CURRENT_DATE, 'Testing', 'Tested login flow and form validation for v2.1 release', 'Completed', 'All test cases passed'),
  ('QA002', CURRENT_DATE, 'Regression', 'Ran full regression suite on payment module', 'Completed', NULL),
  ('QA003', CURRENT_DATE, 'Automation', 'Created 15 new Selenium test scripts for checkout flow', 'Pending', 'Need to add assertions for edge cases'),
  ('QA001', CURRENT_DATE - INTERVAL '1 day', 'Bug Verification', 'Verified 8 bug fixes from sprint 23', 'Completed', 'All bugs confirmed fixed'),
  ('QA002', CURRENT_DATE - INTERVAL '1 day', 'Documentation', 'Updated test plan for release 2.1', 'Completed', NULL),
  ('QA003', CURRENT_DATE - INTERVAL '1 day', 'Testing', 'Tested new dashboard features', 'Completed', NULL),
  ('QA004', CURRENT_DATE - INTERVAL '1 day', 'Meeting', 'Sprint planning and test review', 'Completed', NULL),
  ('QA001', CURRENT_DATE - INTERVAL '2 days', 'Automation', 'Set up CI/CD pipeline for automated tests', 'Completed', NULL),
  ('QA002', CURRENT_DATE - INTERVAL '2 days', 'Testing', 'Tested API endpoints for user management', 'Completed', NULL),
  ('QA004', CURRENT_DATE - INTERVAL '2 days', 'Bug Verification', 'Verified critical production bug fix', 'Completed', 'Deployed to staging'),
  ('QA001', CURRENT_DATE - INTERVAL '3 days', 'Testing', 'Smoke testing after deployment', 'Completed', NULL),
  ('QA002', CURRENT_DATE - INTERVAL '3 days', 'Regression', 'Regression testing on search module', 'Pending', 'Found 2 issues'),
  ('QA003', CURRENT_DATE - INTERVAL '3 days', 'Automation', 'Updated test framework to latest version', 'Completed', NULL),
  ('QA004', CURRENT_DATE - INTERVAL '3 days', 'Testing', 'Cross-browser testing on Safari and Firefox', 'Completed', NULL),
  ('QA001', CURRENT_DATE - INTERVAL '4 days', 'Documentation', 'Created QA process documentation', 'Completed', NULL),
  ('QA002', CURRENT_DATE - INTERVAL '4 days', 'Testing', 'Performance testing on report generation', 'Completed', NULL),
  ('QA003', CURRENT_DATE - INTERVAL '4 days', 'Bug Verification', 'Verified 5 UI bugs from sprint 22', 'Completed', 'All verified'),
  ('QA004', CURRENT_DATE - INTERVAL '4 days', 'Regression', 'Full regression on notification system', 'Completed', NULL),
  ('QA001', CURRENT_DATE - INTERVAL '5 days', 'Meeting', 'QA sync meeting with dev team', 'Completed', NULL),
  ('QA002', CURRENT_DATE - INTERVAL '5 days', 'Automation', 'Created API test scripts using Postman', 'Completed', NULL),
  ('QA003', CURRENT_DATE - INTERVAL '5 days', 'Testing', 'Tested mobile responsiveness', 'Completed', NULL),
  ('QA004', CURRENT_DATE - INTERVAL '5 days', 'Documentation', 'Updated test case repository', 'Pending', 'In progress'),
  ('QA001', CURRENT_DATE - INTERVAL '6 days', 'Regression', 'Regression testing on auth module', 'Completed', NULL),
  ('QA002', CURRENT_DATE - INTERVAL '6 days', 'Bug Verification', 'Verified login page bug fixes', 'Completed', NULL),
  ('QA003', CURRENT_DATE - INTERVAL '6 days', 'Meeting', 'Sprint retrospective', 'Completed', NULL),
  ('QA004', CURRENT_DATE - INTERVAL '6 days', 'Testing', 'Tested email notification system', 'Completed', NULL)
ON CONFLICT (employee_id, date) DO NOTHING;
