// Hotel Maintenance Pro - Cost Comparison (internal vs external rates)

import { useState, useMemo, useEffect } from 'react';
import { Calculator, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentHotel, getDamages, getExternalRates, setExternalRates, subscribe, type DateRange } from '@/data/store';
import { getAllCategories } from '@/constants/externalRates';
import type { DamageCategory } from '@/types';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Period = 'all' | 'monthly' | 'yearly' | 'custom';

function getDateRangeForPeriod(period: Period, customStart: string, customEnd: string): DateRange | undefined {
  if (period === 'all') return undefined;
  const today = new Date();
  let start: Date;
  let end: Date;
  if (period === 'monthly') {
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
  return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
}

function categoryLabel(cat: DamageCategory): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
}

export function CostComparison() {
  const [, setRefresh] = useState(0);
  useEffect(() => {
    return subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const hotel = getCurrentHotel();
  const [period, setPeriod] = useState<Period>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateRange = useMemo(
    () => getDateRangeForPeriod(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const damages = hotel ? getDamages(hotel.id, dateRange) : [];
  const externalRates = getExternalRates();

  const { byCategory, totalInternal, totalExternal, totalSavings } = useMemo(() => {
    const byCategory: Record<DamageCategory, { count: number; internal: number; external: number; savings: number }> = {
      plumbing: { count: 0, internal: 0, external: 0, savings: 0 },
      electrical: { count: 0, internal: 0, external: 0, savings: 0 },
      furniture: { count: 0, internal: 0, external: 0, savings: 0 },
      appliances: { count: 0, internal: 0, external: 0, savings: 0 },
      structural: { count: 0, internal: 0, external: 0, savings: 0 },
      hvac: { count: 0, internal: 0, external: 0, savings: 0 },
      painting: { count: 0, internal: 0, external: 0, savings: 0 },
      cleaning: { count: 0, internal: 0, external: 0, savings: 0 },
      other: { count: 0, internal: 0, external: 0, savings: 0 },
    };
    for (const d of damages) {
      const cat = d.category;
      const internal = d.cost ?? 0;
      const hours = d.hoursSpent ?? 1;
      const externalEst = externalRates[cat] * hours;
      const savings = externalEst - internal;
      byCategory[cat].count += 1;
      byCategory[cat].internal += internal;
      byCategory[cat].external += externalEst;
      byCategory[cat].savings += savings;
    }
    let totalInternal = 0;
    let totalExternal = 0;
    for (const cat of getAllCategories()) {
      totalInternal += byCategory[cat].internal;
      totalExternal += byCategory[cat].external;
    }
    const totalSavings = totalExternal - totalInternal;
    return { byCategory, totalInternal, totalExternal, totalSavings };
  }, [damages, externalRates]);

  const handleRateChange = (category: DamageCategory, value: string) => {
    const num = parseFloat(value);
    if (!Number.isNaN(num) && num >= 0) {
      setExternalRates({ [category]: num });
    }
  };

  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500">
        Select a hotel to view cost comparison.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          Cost comparison
        </h1>
        <p className="text-sm text-gray-600">
          Rates are Sydney NSW 2026 reference (AUD/h). You can edit below. External estimated cost = (rate AUD/h) × hours spent per repair; repairs without hours use 1 h.
        </p>
      </div>

      {/* Section 1 – Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">External rates (AUD/h)</CardTitle>
          <p className="text-sm text-gray-500">Hourly rates used to estimate external cost per category.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAllCategories().map((cat) => (
              <div key={cat} className="flex items-center gap-2">
                <Label htmlFor={`rate-${cat}`} className="min-w-[100px]">{categoryLabel(cat)}</Label>
                <Input
                  id={`rate-${cat}`}
                  type="number"
                  min={0}
                  step={5}
                  value={externalRates[cat]}
                  onChange={(e) => handleRateChange(cat, e.target.value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Date range filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Period</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label>Range</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="monthly">This month</SelectItem>
                <SelectItem value="yearly">This year</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {period === 'custom' && (
            <>
              <div className="flex flex-col gap-1">
                <Label>Start</Label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-[140px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>End</Label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-[140px]"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 2 – Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Internal vs external (estimated)</CardTitle>
          <p className="text-sm text-gray-500">
            For the selected period: internal = what you paid; external = sum of (rate × hours) for each repair; savings = external − internal.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Category</th>
                  <th className="text-right py-2 font-medium">Repairs</th>
                  <th className="text-right py-2 font-medium">Internal (AUD)</th>
                  <th className="text-right py-2 font-medium">External (by hours, AUD)</th>
                  <th className="text-right py-2 font-medium">Savings (AUD)</th>
                </tr>
              </thead>
              <tbody>
                {getAllCategories().map((cat) => {
                  const row = byCategory[cat];
                  if (row.count === 0) return null;
                  return (
                    <tr key={cat} className="border-b border-gray-100">
                      <td className="py-2">{categoryLabel(cat)}</td>
                      <td className="text-right py-2">{row.count}</td>
                      <td className="text-right py-2">{formatAUD(row.internal)}</td>
                      <td className="text-right py-2">{formatAUD(row.external)}</td>
                      <td className={`text-right py-2 font-medium ${row.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAUD(row.savings)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="py-2">Total</td>
                  <td className="text-right py-2">{damages.length}</td>
                  <td className="text-right py-2">{formatAUD(totalInternal)}</td>
                  <td className="text-right py-2">{formatAUD(totalExternal)}</td>
                  <td className={`text-right py-2 ${totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAUD(totalSavings)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {damages.length === 0 && (
            <p className="text-gray-500 py-4 text-center">No repairs in the selected period.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-6 items-center">
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Total internal: <strong>{formatAUD(totalInternal)}</strong>
            </span>
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Total external (estimated): <strong>{formatAUD(totalExternal)}</strong>
            </span>
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Total savings: <strong className={totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAUD(totalSavings)}</strong>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
