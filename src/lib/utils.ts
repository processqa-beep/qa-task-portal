import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  parseISO,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Universal date parser that handles any date format (MM/DD/YYYY from mobile, DD-MM-YYYY from PC, YYYY-MM-DD, ISO)
 * and normalizes it to standard YYYY-MM-DD format.
 */
export function toStandardDateStr(input: string | Date | null | undefined): string {
  if (!input) return format(new Date(), "yyyy-MM-dd");
  if (input instanceof Date) return format(input, "yyyy-MM-dd");

  const trimmed = String(input).trim();
  if (!trimmed) return format(new Date(), "yyyy-MM-dd");

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // ISO string like 2026-07-24T...
  if (trimmed.includes('T')) {
    return trimmed.split('T')[0];
  }

  // Handle DD-MM-YYYY, DD/MM/YYYY, or MM/DD/YYYY (phone locale)
  const parts = trimmed.split(/[-/]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);

    // YYYY-MM-DD or YYYY/MM/DD
    if (parts[0].length === 4) {
      const mm = String(p2).padStart(2, '0');
      const dd = String(p3).padStart(2, '0');
      return `${p1}-${mm}-${dd}`;
    }

    // DD-MM-YYYY or MM/DD/YYYY where year is parts[2]
    if (parts[2].length === 4) {
      const year = p3;
      let month = p1;
      let day = p2;

      if (p1 > 12) {
        // First part > 12 -> DD-MM-YYYY (e.g. 24-07-2026)
        day = p1;
        month = p2;
      } else if (p2 > 12) {
        // Second part > 12 -> MM/DD/YYYY (e.g. 07/24/2026 on mobile)
        month = p1;
        day = p2;
      }

      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  }

  // Fallback: JS Date parser
  try {
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      return format(parsedDate, "yyyy-MM-dd");
    }
  } catch {
    // ignore
  }

  return trimmed;
}

export function formatDate(
  date: string | Date,
  formatStr: string = "MMM dd, yyyy"
): string {
  if (!date) return "";
  try {
    const std = typeof date === "string" ? toStandardDateStr(date) : date;
    const d = typeof std === "string" ? parseISO(std) : std;
    if (isNaN(d.getTime())) return String(date);
    return format(d, formatStr);
  } catch {
    return String(date);
  }
}

export function getToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getMonthDays(date: Date = new Date()): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
}

export function isTodayDate(date: Date): boolean {
  return isToday(date);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
