import { WorkType, TaskStatus } from './types';

export const WORK_TYPES: WorkType[] = [
  'Testing',
  'Regression',
  'Automation',
  'Bug Verification',
  'Documentation',
  'Meeting',
  'Cloud Vision',
  'Data Analysis',
  'IMS',
  'Process Audit',
  'Devlopment',
  'Additional',
  'Other',
];

export const TASK_STATUSES: TaskStatus[] = ['Completed', 'Pending'];

export const WORK_TYPE_COLORS: Record<WorkType, string> = {
  'Testing': 'hsl(210, 100%, 56%)',
  'Regression': 'hsl(280, 80%, 55%)',
  'Automation': 'hsl(150, 70%, 45%)',
  'Bug Verification': 'hsl(0, 85%, 55%)',
  'Documentation': 'hsl(45, 90%, 50%)',
  'Meeting': 'hsl(200, 60%, 50%)',
  'Cloud Vision': 'hsl(265, 85%, 60%)',
  'Data Analysis': 'hsl(180, 75%, 45%)',
  'IMS': 'hsl(320, 70%, 55%)',
  'Process Audit': 'hsl(35, 90%, 50%)',
  'Devlopment': 'hsl(140, 65%, 45%)',
  'Additional': 'hsl(230, 75%, 60%)',
  'Other': 'hsl(220, 15%, 55%)',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  'Completed': 'hsl(150, 70%, 45%)',
  'Pending': 'hsl(45, 90%, 50%)',
};

export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['employee', 'leader'] as string[],
  },
  {
    title: 'Submit Task',
    href: '/submit',
    icon: 'PlusCircle',
    roles: ['employee', 'leader'] as string[],
  },
  {
    title: 'History',
    href: '/history',
    icon: 'History',
    roles: ['employee', 'leader'] as string[],
  },
  {
    title: 'Assign Tasks',
    href: '/assignments',
    icon: 'ClipboardList',
    roles: ['employee', 'leader'] as string[],
  },
  {
    title: 'Team',
    href: '/team',
    icon: 'Users',
    roles: ['employee', 'leader'] as string[],
  },
  {
    title: 'Impact Review',
    href: '/ceo-review',
    icon: 'TrendingUp',
    roles: ['employee', 'leader'] as string[],
  },
  {
    title: 'About',
    href: '/version-history',
    icon: 'Info',
    roles: ['employee', 'leader'] as string[],
  },
];

export const DRAFT_STORAGE_KEY = 'qa-task-draft';
