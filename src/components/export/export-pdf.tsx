'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { DailyTask } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface ExportPdfProps {
  tasks: DailyTask[];
  filename?: string;
}

export function ExportPdf({ tasks, filename = 'qa-tasks-report' }: ExportPdfProps) {
  const handleExport = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.text('QA Daily Task Report', 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${formatDate(new Date(), 'MMM dd, yyyy h:mm a')}`, 14, 22);

      // Table
      const tableData = tasks.map((task) => [
        task.employee_id,
        (task.employee as unknown as { name: string })?.name || task.employee_id,
        formatDate(task.date, 'yyyy-MM-dd'),
        task.work_type,
        task.task_performed.substring(0, 60) + (task.task_performed.length > 60 ? '...' : ''),
        task.status,
      ]);

      autoTable(doc, {
        head: [['ID', 'Name', 'Date', 'Type', 'Task', 'Status']],
        body: tableData,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [124, 58, 237], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 243, 255] },
      });

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs gap-1.5">
      <FileText className="h-3.5 w-3.5" />
      Export PDF
    </Button>
  );
}
