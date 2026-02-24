// Hotel Maintenance Pro - Maintenance History Page (Hotel-specific)

import { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Wrench, 
  User, 
  DollarSign,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Building2,
  ChevronDown
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDamages, getCurrentHotel } from '@/data/store';
import type { Damage, DamageCategory, Hotel } from '@/types';
import { format, parseISO } from 'date-fns';
import { ImageGallery } from '@/components/ImageGallery';

const categories: DamageCategory[] = ['plumbing', 'electrical', 'furniture', 'appliances', 'structural', 'hvac', 'painting', 'cleaning', 'other'];

export function MaintenanceHistory() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<DamageCategory | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDamage, setSelectedDamage] = useState<Damage | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const currentHotel = getCurrentHotel();
    if (currentHotel) {
      setHotel(currentHotel);
      loadHotelData(currentHotel.id);
    }
  }, []);

  const loadHotelData = (hotelId: string) => {
    const allDamages = getDamages(hotelId);
    // Sort by completed date (most recent first)
    const sorted = allDamages.sort((a, b) => {
      const dateA = a.completedDate ? new Date(a.completedDate) : new Date(a.reportedDate);
      const dateB = b.completedDate ? new Date(b.completedDate) : new Date(b.reportedDate);
      return dateB.getTime() - dateA.getTime();
    });
    setDamages(sorted);
  };

  const getAvailableMonths = () => {
    const months = new Set<string>();
    damages.forEach(d => {
      const date = d.completedDate || d.reportedDate;
      const monthKey = format(parseISO(date), 'yyyy-MM');
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  };

  const filteredDamages = damages.filter(damage => {
    const matchesSearch = 
      damage.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      damage.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      damage.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (damage.assignedTo && damage.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || damage.category === filterCategory;
    
    let matchesMonth = true;
    if (filterMonth !== 'all') {
      const date = damage.completedDate || damage.reportedDate;
      const damageMonth = format(parseISO(date), 'yyyy-MM');
      matchesMonth = damageMonth === filterMonth;
    }
    
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const totalPages = Math.ceil(filteredDamages.length / itemsPerPage);
  const paginatedDamages = filteredDamages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const exportToCSV = () => {
    if (!hotel) return;
    
    const headers = ['Date', 'Room', 'Category', 'Description', 'Status', 'Priority', 'Cost', 'Assigned To', 'Materials', 'Notes'];
    const rows = filteredDamages.map(d => [
      d.completedDate || d.reportedDate,
      d.roomNumber,
      d.category,
      d.description,
      d.status,
      d.priority,
      d.cost,
      d.assignedTo || '',
      d.materials.join('; '),
      d.notes
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hotel.name}-maintenance-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCost = filteredDamages.reduce((sum, d) => sum + d.cost, 0);
  const completedCount = filteredDamages.filter(d => d.status === 'completed').length;

  // Category-specific history when a category is selected
  const categoryDamages = filterCategory !== 'all' 
    ? damages.filter(d => d.category === filterCategory)
    : [];
  
  const categoryStats = filterCategory !== 'all' ? {
    total: categoryDamages.length,
    completed: categoryDamages.filter(d => d.status === 'completed').length,
    totalCost: categoryDamages.reduce((sum, d) => sum + d.cost, 0),
    avgCost: categoryDamages.filter(d => d.status === 'completed').length > 0
      ? categoryDamages.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.cost, 0) / categoryDamages.filter(d => d.status === 'completed').length
      : 0
  } : null;

  if (!hotel) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Please select a hotel first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hotel Header */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: hotel.color }}
        >
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{hotel.name}</h2>
          <p className="text-sm text-gray-500">Maintenance History</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-2xl font-bold">{filteredDamages.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Avg. Cost</p>
            <p className="text-xl font-bold">
              {formatCurrency(completedCount > 0 ? totalCost / completedCount : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v as DamageCategory | 'all'); setCurrentPage(1); }}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-36">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  {getAvailableMonths().map(month => (
                    <SelectItem key={month} value={month}>
                      {format(parseISO(month + '-01'), 'MMMM yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category History Section */}
      {filterCategory !== 'all' && categoryStats && (
        <Collapsible defaultOpen className="space-y-2">
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg capitalize">{filterCategory} History</h3>
                      <p className="text-sm text-gray-500">
                        {categoryStats.total} total repairs • {categoryStats.completed} completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Cost</p>
                      <p className="font-semibold">{formatCurrency(categoryStats.totalCost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Avg. Cost</p>
                      <p className="font-semibold">{formatCurrency(categoryStats.avgCost)}</p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {categoryDamages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No repairs found for this category</p>
                  ) : (
                    categoryDamages.map((damage) => (
                      <div key={damage.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Room {damage.roomNumber}</span>
                              <Badge className={getStatusColor(damage.status)}>
                                {damage.status}
                              </Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                {damage.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{damage.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{format(parseISO(damage.reportedDate), 'MMM d, yyyy')}</span>
                              {damage.completedDate && (
                                <span className="text-green-600">
                                  Completed: {format(parseISO(damage.completedDate), 'MMM d, yyyy')}
                                </span>
                              )}
                              {damage.assignedTo && <span>Assigned: {damage.assignedTo}</span>}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold">{formatCurrency(damage.cost)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* History List */}
      <div className="space-y-3">
        {paginatedDamages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No maintenance records found at {hotel.name}</p>
            </CardContent>
          </Card>
        ) : (
          paginatedDamages.map((damage) => (
            <Card
              key={damage.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedDamage(damage)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-lg">Room {damage.roomNumber}</span>
                      <Badge className={getStatusColor(damage.status)}>
                        {damage.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {damage.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Wrench className="w-4 h-4" />
                      <span className="capitalize">{damage.category}</span>
                    </div>
                    
                    <p className="text-gray-800">{damage.description}</p>
                    
                    {damage.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{damage.notes}</p>
                    )}
                    
                    {damage.images && damage.images.length > 0 && (
                      <ImageGallery images={damage.images} damageId={damage.id} />
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Reported: {format(parseISO(damage.reportedDate), 'MMM d, yyyy')}
                      </span>
                      {damage.completedDate && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Completed: {format(parseISO(damage.completedDate), 'MMM d, yyyy')}
                        </span>
                      )}
                      {damage.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {damage.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <DollarSign className="w-5 h-5" />
                      {formatCurrency(damage.cost)}
                    </div>
                    {damage.materials.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {damage.materials.map((material, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {material}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={selectedDamage !== null} onOpenChange={(open) => !open && setSelectedDamage(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedDamage && (
            <>
              <DialogHeader>
                <DialogTitle>Room {selectedDamage.roomNumber} – {selectedDamage.category}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(selectedDamage.status)}>
                    {selectedDamage.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedDamage.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Wrench className="w-4 h-4" />
                  <span className="capitalize">{selectedDamage.category}</span>
                </div>
                <p className="text-gray-800">{selectedDamage.description}</p>
                {selectedDamage.notes && (
                  <p className="text-sm text-gray-500 italic">{selectedDamage.notes}</p>
                )}
                {selectedDamage.images && selectedDamage.images.length > 0 && (
                  <ImageGallery images={selectedDamage.images} damageId={selectedDamage.id} />
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Reported: {format(parseISO(selectedDamage.reportedDate), 'MMM d, yyyy')}
                  </span>
                  {selectedDamage.completedDate && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Completed: {format(parseISO(selectedDamage.completedDate), 'MMM d, yyyy')}
                    </span>
                  )}
                  {selectedDamage.assignedTo && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedDamage.assignedTo}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-lg font-semibold">
                  <DollarSign className="w-5 h-5" />
                  {formatCurrency(selectedDamage.cost)}
                </div>
                {(selectedDamage.hoursSpent != null && selectedDamage.hoursSpent > 0) && (
                  <div className="text-sm text-gray-600">
                    Hours spent: {selectedDamage.hoursSpent} h
                    {selectedDamage.cost != null && (
                      <span className="ml-2">
                        Effective rate: {formatCurrency(selectedDamage.cost / selectedDamage.hoursSpent)}/h
                      </span>
                    )}
                  </div>
                )}
                {(selectedDamage.itemsUsed && selectedDamage.itemsUsed.length > 0) ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedDamage.itemsUsed.map((item, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {item.brand ? `${item.name} (${item.brand})` : item.name}
                        {item.estimatedCost != null ? ` — ${formatCurrency(item.estimatedCost)}` : ''}
                      </span>
                    ))}
                  </div>
                ) : selectedDamage.materials.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedDamage.materials.map((material, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {material}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
