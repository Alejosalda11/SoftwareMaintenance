// Hotel Maintenance Pro - PDF Report Generator

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Hotel, Damage, CategoryStats, MaintenanceStats, DamageCategory } from '@/types';
import { getAllCategories } from '@/constants/externalRates';
import { format } from 'date-fns';

export interface ChartImageOption {
  title: string;
  dataUrl: string;
}

interface PDFOptions {
  hotel: Hotel;
  damages: Damage[];
  categoryStats: CategoryStats[];
  maintenanceStats: MaintenanceStats;
  dateRange?: { start: string; end: string };
  chartImages?: ChartImageOption[];
}

export async function generatePDFReport(options: PDFOptions): Promise<void> {
  const { hotel, damages, categoryStats, maintenanceStats, dateRange, chartImages } = options;
 
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 16;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 16;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const footerY = pageHeight - 8;
  let yPos = marginTop;

  const ensureSpace = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - marginBottom - 8) {
      doc.addPage();
      yPos = marginTop;
    }
  };
  const toPercent = (value: number, total: number) => (total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0.0%');

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginLeft, yPos, usableWidth, 30, 2, 2, 'FD');
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(marginLeft + 4, yPos + 5, 4, 20, 1, 1, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(hotel.name, marginLeft + 12, yPos + 13);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Maintenance Report', marginLeft + 12, yPos + 21);
  doc.setTextColor(0, 0, 0);
  yPos += 40;

  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, marginLeft, yPos);
  if (dateRange) {
    doc.text(
      `Period: ${format(new Date(dateRange.start), 'MMM d, yyyy')} - ${format(new Date(dateRange.end), 'MMM d, yyyy')}`,
      marginLeft + usableWidth / 2,
      yPos
    );
  }
  doc.text(`Address: ${hotel.address}`, marginLeft + usableWidth, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  // Summary Statistics
  ensureSpace(45);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryData = [
    ['Total Repairs', maintenanceStats.totalRepairs.toString()],
    ['Pending Repairs', maintenanceStats.pendingRepairs.toString()],
    ['Completed This Month', maintenanceStats.completedThisMonth.toString()],
    ['Total Expenses', `$${maintenanceStats.totalExpenses.toFixed(2)}`],
    ['Average Repair Cost', `$${maintenanceStats.averageRepairCost.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 3, textColor: [17, 24, 39] },
    margin: { left: marginLeft, right: marginRight },
    columnStyles: {
      0: { cellWidth: usableWidth * 0.65 },
      1: { cellWidth: usableWidth * 0.35, halign: 'right' },
    },
  });
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Category Breakdown
  if (categoryStats.length > 0) {
    ensureSpace(55);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Breakdown', marginLeft, yPos);
    yPos += 8;

    const categoryData = categoryStats.map(stat => [
      stat.category.charAt(0).toUpperCase() + stat.category.slice(1),
      stat.count.toString(),
      `$${stat.totalCost.toFixed(2)}`,
      stat.count > 0 ? `$${(stat.totalCost / stat.count).toFixed(2)}` : '$0.00'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Count', 'Total Cost', 'Avg. Cost']],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 9.5, cellPadding: 3, textColor: [17, 24, 39] },
      margin: { left: marginLeft, right: marginRight },
      columnStyles: {
        0: { cellWidth: usableWidth * 0.34 },
        1: { cellWidth: usableWidth * 0.16, halign: 'center' },
        2: { cellWidth: usableWidth * 0.25, halign: 'right' },
        3: { cellWidth: usableWidth * 0.25, halign: 'right' },
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Internal vs external cost
  if (damages.length > 0) {
    ensureSpace(65);
    const byCategory: Record<DamageCategory, { internal: number; external: number }> = {} as any;
    for (const cat of getAllCategories()) {
      byCategory[cat] = { internal: 0, external: 0 };
    }
    for (const d of damages) {
      const cat = d.category;
      const internal = d.cost ?? 0;
      byCategory[cat].internal += internal;
      byCategory[cat].external += internal * 1.4;
    }
    let totalInternal = 0;
    let totalExternal = 0;
    const rows: [string, string, string, string][] = [];
    for (const cat of getAllCategories()) {
      const row = byCategory[cat];
      if (row.internal === 0 && row.external === 0) continue;
      totalInternal += row.internal;
      totalExternal += row.external;
      rows.push([
        cat.charAt(0).toUpperCase() + cat.slice(1),
        `$${row.internal.toFixed(2)}`,
        `$${row.external.toFixed(2)}`,
        `$${(row.external - row.internal).toFixed(2)}`,
      ]);
    }
    if (rows.length > 0) {
      rows.push(['Total', `$${totalInternal.toFixed(2)}`, `$${totalExternal.toFixed(2)}`, `$${(totalExternal - totalInternal).toFixed(2)}`]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Internal vs external cost', marginLeft, yPos);
      yPos += 8;
      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Internal (AUD)', 'External (AUD)', 'Savings (AUD)']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9.5, cellPadding: 3, textColor: [17, 24, 39] },
        margin: { left: marginLeft, right: marginRight },
        columnStyles: {
          0: { cellWidth: usableWidth * 0.28 },
          1: { cellWidth: usableWidth * 0.24, halign: 'right' },
          2: { cellWidth: usableWidth * 0.26, halign: 'right' },
          3: { cellWidth: usableWidth * 0.22, halign: 'right' },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('External values are estimated market benchmarks for each repair.', marginLeft, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    }
  }

  // Chart images (hybrid)
  if (chartImages && chartImages.length > 0) {
    const chartWidth = usableWidth;
    const chartHeight = Math.min(120, chartWidth * 0.58);
    for (const chart of chartImages) {
      ensureSpace(chartHeight + 24);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(chart.title, marginLeft, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Visual summary for client presentation', marginLeft, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 4;
      try {
        doc.addImage(chart.dataUrl, 'PNG', marginLeft, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 10;
      } catch {
        yPos += 5;
      }
    }
  }

  // Recent Repairs Table
  if (damages.length > 0) {
    ensureSpace(70);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Repairs', marginLeft, yPos);
    yPos += 8;

    const recentDamages = damages.slice(0, 50);
    const repairsData = recentDamages.map(damage => [
      format(new Date(damage.reportedDate), 'MMM d, yyyy'),
      damage.roomNumber,
      damage.category.charAt(0).toUpperCase() + damage.category.slice(1),
      damage.description.substring(0, 40) + (damage.description.length > 40 ? '...' : ''),
      damage.status,
      `$${damage.cost.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Room', 'Category', 'Description', 'Status', 'Cost']],
      body: repairsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2.5, textColor: [17, 24, 39] },
      margin: { left: marginLeft, right: marginRight },
      columnStyles: {
        0: { cellWidth: usableWidth * 0.16 },
        1: { cellWidth: usableWidth * 0.1, halign: 'center' },
        2: { cellWidth: usableWidth * 0.17 },
        3: { cellWidth: usableWidth * 0.31 },
        4: { cellWidth: usableWidth * 0.13, halign: 'center' },
        5: { cellWidth: usableWidth * 0.13, halign: 'right' },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Status and priority tables
  if (damages.length > 0) {
    const statusCounts = {
      Completed: damages.filter((d) => d.status === 'completed').length,
      'In Progress': damages.filter((d) => d.status === 'in-progress').length,
      Pending: damages.filter((d) => d.status === 'pending').length,
      Cancelled: damages.filter((d) => d.status === 'cancelled').length,
    };
    const priorityCounts = {
      Urgent: damages.filter((d) => d.priority === 'urgent').length,
      High: damages.filter((d) => d.priority === 'high').length,
      Medium: damages.filter((d) => d.priority === 'medium').length,
      Low: damages.filter((d) => d.priority === 'low').length,
    };
    const statusRows = Object.entries(statusCounts).filter(([, c]) => c > 0).map(([l, c]) => [l, String(c), toPercent(c, damages.length)]);
    const priorityRows = Object.entries(priorityCounts).filter(([, c]) => c > 0).map(([l, c]) => [l, String(c), toPercent(c, damages.length)]);

    if (statusRows.length > 0) {
      ensureSpace(55);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Repair Status Summary', marginLeft, yPos);
      yPos += 7;
      autoTable(doc, {
        startY: yPos,
        head: [['Status', 'Count', 'Share']],
        body: statusRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9.5, cellPadding: 3, textColor: [17, 24, 39] },
        margin: { left: marginLeft, right: marginRight },
        columnStyles: { 0: { cellWidth: usableWidth * 0.5 }, 1: { cellWidth: usableWidth * 0.2, halign: 'right' }, 2: { cellWidth: usableWidth * 0.3, halign: 'right' } },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }
    if (priorityRows.length > 0) {
      ensureSpace(55);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Repair Priority Summary', marginLeft, yPos);
      yPos += 7;
      autoTable(doc, {
        startY: yPos,
        head: [['Priority', 'Count', 'Share']],
        body: priorityRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9.5, cellPadding: 3, textColor: [17, 24, 39] },
        margin: { left: marginLeft, right: marginRight },
        columnStyles: { 0: { cellWidth: usableWidth * 0.5 }, 1: { cellWidth: usableWidth * 0.2, halign: 'right' }, 2: { cellWidth: usableWidth * 0.3, halign: 'right' } },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `${hotel.name}-maintenance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
