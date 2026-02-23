// Hotel Maintenance Pro - Reports Page (Hotel-specific)

import { useRef, useState, useMemo, useEffect } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Wrench,
  Calendar,
  Building2,
  FileText
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#6b7280'];

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
  const chart2Ref = useRef<HTMLDivElement>(null);
  const chart3Ref = useRef<HTMLDivElement>(null);
  const chart4Ref = useRef<HTMLDivElement>(null);
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
        { ref: chart2Ref, title: 'Repairs by Category' },
        { ref: chart3Ref, title: 'Monthly Trends' },
        { ref: chart4Ref, title: 'Status & Priority' },
      ];
      for (const { ref, title } of refs) {
        if (ref.current) {
          try {
            const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true });
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
          chartImages: chartImages.length > 0 ? chartImages : undefined
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="cost" fill={hotel.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {categoryData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
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
              </div>
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
                        {statusData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Priority</CardTitle>
              </CardHeader>
              <CardContent>
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
                        {priorityData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
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
          className="fixed left-[-9999px] top-0 w-[400px] bg-white"
          style={{ zIndex: -1 }}
        >
          <div ref={chart1Ref} className="w-[400px] h-[300px]">
            <ResponsiveContainer width={400} height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Bar dataKey="cost" fill={hotel.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div ref={chart2Ref} className="w-[400px] h-[300px]">
            <ResponsiveContainer width={400} height={300}>
              <RePieChart>
                <Pie data={categoryData} cx="50%" cy="50%" dataKey="count" outerRadius={80}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div ref={chart3Ref} className="w-[400px] h-[300px]">
            <ResponsiveContainer width={400} height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v}`} />
                <Line yAxisId="left" type="monotone" dataKey="repairs" stroke="#3b82f6" name="Repairs" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="expenses" stroke="#10b981" name="Expenses" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div ref={chart4Ref} className="w-[400px] h-[300px] flex gap-2">
            <div className="w-[190px] h-[300px]">
              <ResponsiveContainer width={190} height={300}>
                <RePieChart>
                  <Pie data={statusData} cx="50%" cy="50%" dataKey="value" innerRadius={50} outerRadius={70}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-[190px] h-[300px]">
              <ResponsiveContainer width={190} height={300}>
                <RePieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" dataKey="value" innerRadius={50} outerRadius={70}>
                    {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
