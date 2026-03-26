// Hotel Maintenance Pro - Reports Page (Hotel-specific)

import { useRef, useState, useMemo, useEffect } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Wrench,
  Calendar,
  Building2,
  FileText,
  CircleOff
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDamages, getCategoryStats, getMonthlyStats, getMaintenanceStats, getCurrentHotel, type DateRange } from '@/data/store';
import { format, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { generatePDFReport, type ChartImageOption } from '@/lib/pdfGenerator';
import html2canvas from 'html2canvas';

const CATEGORY_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#14b8a6', '#64748b', '#ef4444'];
const STATUS_COLORS: Record<string, string> = {
  Completed: '#16a34a',
  'In Progress': '#2563eb',
  Pending: '#d97706',
  Cancelled: '#6b7280',
};
const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#dc2626',
  High: '#ea580c',
  Medium: '#2563eb',
  Low: '#16a34a',
};

type ReportPeriod = 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';

function getDateRangeForPeriod(period: ReportPeriod, customStart: string, customEnd: string): DateRange | undefined {
  const today = new Date();
  let start: Date;
  let end: Date;
  if (period === 'weekly') {
    start = startOfWeek(today, { weekStartsOn: 1 });
    end = endOfWeek(today, { weekStartsOn: 1 });
  } else if (period === 'biweekly') {
    end = today;
    start = subDays(today, 14);
  } else if (period === 'monthly') {
    start = startOfMonth(today);
    end = endOfMonth(today);
  } else if (period === 'yearly') {
    start = startOfYear(today);
    end = endOfYear(today);
  } else {
    if (!customStart || !customEnd) return undefined;
    start = new Date(customStart);
    end = new Date(customEnd);
  }
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd')
  };
}

export function Reports() {
  const hotel = getCurrentHotel();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateRange = useMemo(
    () => getDateRangeForPeriod(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const damages = hotel ? getDamages(hotel.id, dateRange) : [];
  const categoryStats = hotel ? getCategoryStats(hotel.id, dateRange) : [];
  const monthlyStats = hotel ? getMonthlyStats(hotel.id, dateRange) : [];
  const maintenanceStats = hotel ? getMaintenanceStats(hotel.id, dateRange) : {
    totalRepairs: 0,
    pendingRepairs: 0,
    completedThisMonth: 0,
    totalExpenses: 0,
    averageRepairCost: 0
  };
  const reportRef = useRef<HTMLDivElement>(null);
  const chart1Ref = useRef<HTMLDivElement>(null);
  const chartComparativesRef = useRef<HTMLDivElement>(null);
  const [capturingCharts, setCapturingCharts] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleExportPDF = async () => {
    if (!hotel) return;
    if (period === 'custom' && (!customStart || !customEnd)) {
      toast.error('Please select start and end dates for custom range');
      return;
    }
    setCapturingCharts(true);
  };

  useEffect(() => {
    if (!capturingCharts || !hotel) return;
    const run = async () => {
      await new Promise(r => setTimeout(r, 400));
      const chartImages: ChartImageOption[] = [];
      const refs = [
        { ref: chart1Ref, title: 'Expenses by Category' },
        { ref: chartComparativesRef, title: 'Internal vs External Comparison' },
      ];
      for (const { ref, title } of refs) {
        if (ref.current) {
          try {
            const canvas = await html2canvas(ref.current, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
            });
            chartImages.push({ title, dataUrl: canvas.toDataURL('image/png') });
          } catch (e) {
            console.warn('Chart capture failed:', title, e);
          }
        }
      }
      setCapturingCharts(false);
      try {
        await generatePDFReport({
          hotel,
          damages,
          categoryStats,
          maintenanceStats,
          dateRange: dateRange ?? undefined,
          chartImages: chartImages.length > 0 ? chartImages : undefined,
        });
        toast.success('PDF report generated successfully!');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF report');
      }
    };
    run();
  }, [capturingCharts]);

  // Prepare data for charts
  const categoryData = categoryStats.map(stat => ({
    name: stat.category.charAt(0).toUpperCase() + stat.category.slice(1),
    count: stat.count,
    cost: stat.totalCost
  }));
  const comparisonData = categoryStats
    .filter((stat) => stat.count > 0)
    .map((stat) => {
      const internal = stat.totalCost;
      const external = internal * 1.4;
      return {
        name: stat.category.charAt(0).toUpperCase() + stat.category.slice(1),
        internal,
        external,
        savings: external - internal,
      };
    });
  const totalInternal = comparisonData.reduce((acc, row) => acc + row.internal, 0);
  const totalExternal = comparisonData.reduce((acc, row) => acc + row.external, 0);
  const totalSavings = totalExternal - totalInternal;

  const monthlyData = monthlyStats.map(stat => ({
    month: stat.month,
    repairs: stat.repairs,
    expenses: stat.expenses
  }));

  const statusData = [
    { name: 'Completed', value: damages.filter(d => d.status === 'completed').length },
    { name: 'In Progress', value: damages.filter(d => d.status === 'in-progress').length },
    { name: 'Pending', value: damages.filter(d => d.status === 'pending').length },
    { name: 'Cancelled', value: damages.filter(d => d.status === 'cancelled').length },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'Urgent', value: damages.filter(d => d.priority === 'urgent').length },
    { name: 'High', value: damages.filter(d => d.priority === 'high').length },
    { name: 'Medium', value: damages.filter(d => d.priority === 'medium').length },
    { name: 'Low', value: damages.filter(d => d.priority === 'low').length },
  ].filter(d => d.value > 0);

  const hasData = damages.length > 0;
  const emptyState = (message: string) => (
    <div className="h-80 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center px-6">
      <CircleOff className="w-7 h-7 text-gray-400 mb-2" />
      <p className="text-sm font-medium text-gray-700">{message}</p>
      <p className="text-xs text-gray-500 mt-1">Try another period or include more records.</p>
    </div>
  );

  if (!hotel) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Please select a hotel first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Hotel Header */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 print:hidden">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: hotel.color }}
        >
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{hotel.name}</h2>
          <p className="text-sm text-gray-500">Reports & Analytics</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Reports</h2>
          <p className="text-gray-500">Analytics and insights for {hotel.name}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === 'custom' && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Desde</Label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Hasta</Label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
              </>
            )}
          </div>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-3xl font-bold text-center">{hotel.name}</h1>
        <h2 className="text-xl text-center text-gray-600 mt-2">Maintenance Report</h2>
        <p className="text-center text-gray-500 mt-2">
          Generated on {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Repairs</p>
                <p className="text-2xl font-bold">{maintenanceStats.totalRepairs}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-xl font-bold">{formatCurrency(maintenanceStats.totalExpenses)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Cost</p>
                <p className="text-xl font-bold">{formatCurrency(maintenanceStats.averageRepairCost)}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold">{maintenanceStats.completedThisMonth}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="expenses" className="print:hidden">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2 h-auto p-1">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="comparatives">Comparatives</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Expenses by Category - {hotel.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? emptyState('No expense data for the selected period.') : <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis
                      domain={[0, (dataMax: number) => Math.ceil((dataMax || 0) * 1.15 / 100) * 100]}
                      allowDecimals={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="cost" fill={hotel.color} radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="cost"
                        position="top"
                        formatter={(value: number) => `$${Math.round(value)}`}
                        style={{ fill: '#111827', fontSize: 12, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Repairs by Category - {hotel.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? emptyState('No category distribution available for this period.') : <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {categoryData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Monthly Trends - {hotel.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? emptyState('No trend data available for this period.') : <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'expenses') return formatCurrency(Number(value));
                      return value;
                    }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="repairs" stroke="#3b82f6" name="Repairs" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="expenses" stroke="#10b981" name="Expenses ($)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>By Status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length === 0 ? emptyState('No status data available for this period.') : (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] ?? CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      {statusData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between rounded-md border px-2 py-1">
                          <span className="flex items-center gap-2 text-gray-700">
                            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] ?? CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                            {entry.name}
                          </span>
                          <span className="font-semibold text-gray-900">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Priority</CardTitle>
              </CardHeader>
              <CardContent>
                {priorityData.length === 0 ? emptyState('No priority data available for this period.') : (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={priorityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {priorityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] ?? CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      {priorityData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between rounded-md border px-2 py-1">
                          <span className="flex items-center gap-2 text-gray-700">
                            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[entry.name] ?? CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                            {entry.name}
                          </span>
                          <span className="font-semibold text-gray-900">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparatives" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-600">Total Internal</p><p className="text-xl font-bold mt-1">{formatCurrency(totalInternal)}</p></CardContent></Card>
            <Card className="border-indigo-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-600">Total External</p><p className="text-xl font-bold mt-1">{formatCurrency(totalExternal)}</p></CardContent></Card>
            <Card className="border-emerald-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-600">Estimated Savings Gap</p><p className="text-xl font-bold mt-1 text-emerald-700">{formatCurrency(totalSavings)}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Internal vs External by Category</CardTitle></CardHeader>
            <CardContent>
              {comparisonData.length === 0 ? emptyState('No data available to compare internal and external costs.') : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, (dataMax: number) => Math.ceil((dataMax || 0) * 1.15 / 100) * 100]} allowDecimals={false} tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="internal" name="Internal" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="external" name="External" fill="#0f766e" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="external" position="top" formatter={(value: number) => `$${Math.round(value)}`} style={{ fill: '#111827', fontSize: 11, fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Executive Category Summary</CardTitle></CardHeader>
            <CardContent>
              {!hasData ? emptyState('No records available to build the summary table.') : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-medium text-gray-700">Category</th><th className="px-4 py-3 text-right font-medium text-gray-700">Repairs</th><th className="px-4 py-3 text-right font-medium text-gray-700">Total Cost</th><th className="px-4 py-3 text-right font-medium text-gray-700">Average Cost</th></tr></thead>
                    <tbody>{categoryStats.map((stat) => (<tr key={stat.category} className="border-t"><td className="px-4 py-3 capitalize">{stat.category}</td><td className="px-4 py-3 text-right">{stat.count}</td><td className="px-4 py-3 text-right">{formatCurrency(stat.totalCost)}</td><td className="px-4 py-3 text-right">{formatCurrency(stat.count > 0 ? stat.totalCost / stat.count : 0)}</td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print-only summary table */}
      <div className="hidden print:block">
        <h3 className="text-xl font-bold mb-4">Category Summary - {hotel.name}</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Count</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Total Cost</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Avg. Cost</th>
            </tr>
          </thead>
          <tbody>
            {categoryStats.map((stat) => (
              <tr key={stat.category}>
                <td className="border border-gray-300 px-4 py-2 capitalize">{stat.category}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{stat.count}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(stat.totalCost)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {formatCurrency(stat.count > 0 ? stat.totalCost / stat.count : 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Off-screen chart capture for PDF export */}
      {capturingCharts && (
        <div
          aria-hidden
          className="fixed left-[-9999px] top-0 w-[640px] bg-white p-4"
          style={{ zIndex: -1 }}
        >
          <div ref={chart1Ref} className="w-[600px] h-[340px] bg-white">
            <ResponsiveContainer width={600} height={340}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  domain={[0, (dataMax: number) => Math.ceil((dataMax || 0) * 1.15 / 100) * 100]}
                  allowDecimals={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Bar dataKey="cost" fill={hotel.color} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="cost" position="top" formatter={(value: number) => `$${Math.round(value)}`} style={{ fill: '#111827', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div ref={chartComparativesRef} className="w-[600px] h-[340px] bg-white">
            <ResponsiveContainer width={600} height={340}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Legend />
                <Bar dataKey="internal" name="Internal" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="external" name="External" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
