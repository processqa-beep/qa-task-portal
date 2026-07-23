'use client';

import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { DailyTask } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface ExportExcelProps {
  tasks: DailyTask[];
  filename?: string;
}

export function ExportExcel({ tasks, filename = 'qa-tasks-report' }: ExportExcelProps) {
  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');

      const data = tasks.map((task) => ({
        'Employee ID': task.employee_id,
        'Employee Name': (task.employee as unknown as { name: string })?.name || task.employee_id,
        'Date': formatDate(task.date, 'yyyy-MM-dd'),
        'Work Type': task.work_type,
        'Task Performed': task.task_performed,
        'Status': task.status,
        'Remarks': task.remarks || '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length, ...data.map((row) => String(row[key as keyof typeof row] || '').length)),
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs gap-1.5">
      <FileSpreadsheet className="h-3.5 w-3.5" />
      Export Excel
    </Button>
  );
}
