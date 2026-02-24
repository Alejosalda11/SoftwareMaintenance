// Hotel Maintenance Pro - PDF Report Generator

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Hotel, Damage, CategoryStats, MaintenanceStats, ExternalRates, DamageCategory } from '@/types';
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
  externalRates?: ExternalRates;
}

export async function generatePDFReport(options: PDFOptions): Promise<void> {
  const { hotel, damages, categoryStats, maintenanceStats, dateRange, chartImages, externalRates } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  doc.setFillColor(hotel.color.replace('#', ''));
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(hotel.name, 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Maintenance Report', 20, 35);
  
  doc.setTextColor(0, 0, 0);
  yPos = 50;

  // Report Info
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 5;
  if (dateRange) {
    doc.text(`Period: ${format(new Date(dateRange.start), 'MMM d, yyyy')} - ${format(new Date(dateRange.end), 'MMM d, yyyy')}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }
  doc.text(`Address: ${hotel.address}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 15;

  // Summary Statistics
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 20, yPos);
  yPos += 10;

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
    styles: { fontSize: 10 },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Category Breakdown
  if (categoryStats.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Breakdown', 20, yPos);
    yPos += 10;

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
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Internal vs external cost (when external rates provided)
  if (externalRates && damages.length > 0) {
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }
    const byCategory: Record<DamageCategory, { internal: number; external: number }> = {} as any;
    for (const cat of getAllCategories()) {
      byCategory[cat] = { internal: 0, external: 0 };
    }
    for (const d of damages) {
      const cat = d.category;
      const hours = d.hoursSpent ?? 1;
      byCategory[cat].internal += d.cost ?? 0;
      byCategory[cat].external += externalRates[cat] * hours;
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
      doc.text('Internal vs external cost (Sydney NSW 2026 reference)', 20, yPos);
      yPos += 10;
      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Internal (AUD)', 'External estimated (AUD)', 'Savings (AUD)']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 45, halign: 'right' },
          2: { cellWidth: 50, halign: 'right' },
          3: { cellWidth: 45, halign: 'right' },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('External = (rate AUD/h) × hours spent per repair. Repairs without hours use 1 h. Rates are Sydney 2026 reference.', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 15;
    }
  }

  // Recent Repairs Table
  if (damages.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Repairs', 20, yPos);
    yPos += 10;

    // Limit to last 50 repairs for PDF
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
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30 },
        3: { cellWidth: 60 },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }

  // Chart images (if provided)
  if (chartImages && chartImages.length > 0) {
    const chartWidth = pageWidth - 40;
    const chartHeight = 70;
    for (const chart of chartImages) {
      if (yPos > pageHeight - chartHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(chart.title, 20, yPos);
      yPos += 6;
      try {
        doc.addImage(chart.dataUrl, 'PNG', 20, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 15;
      } catch {
        yPos += 5;
      }
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
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `${hotel.name}-maintenance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
