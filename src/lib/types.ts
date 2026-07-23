export interface Employee {
  id: string;
  name: string;
  role: 'employee' | 'leader';
  pin: string;
  avatar_url?: string;
  created_at: string;
}

export interface DailyTask {
  id: string;
  employee_id: string;
  date: string;
  work_type: WorkType;
  task_performed: string;
  status: TaskStatus;
  remarks?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export type WorkType = 
  | 'Testing'
  | 'Regression'
  | 'Automation'
  | 'Bug Verification'
  | 'Documentation'
  | 'Meeting'
  | 'Cloud Vision'
  | 'Data Analysis'
  | 'IMS'
  | 'Process Audit'
  | 'Devlopment'
  | 'Additional'
  | 'Other';

export type TaskStatus = 'Completed' | 'Pending';

export interface TaskFormData {
  work_type: WorkType;
  task_performed: string;
  status: TaskStatus;
  remarks?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  todaySubmitted: number;
  pendingReports: number;
  completedTasks: number;
  pendingTasks: number;
}

export interface EmployeeStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  currentStreak: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type AssignedTaskStatus = 'Assigned' | 'In Progress' | 'Completed';

export interface AssignedTask {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_by: string;
  due_date: string;
  priority: TaskPriority;
  status: AssignedTaskStatus;
  created_at: string;
  assignee?: Employee;
}
