// Hotel Maintenance Pro - Damage Tracker Page (Hotel-specific)

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Wrench, 
  Edit2, 
  Trash2, 
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Building2,
  Calendar,
  User,
  DollarSign
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getDamages, addDamage, updateDamage, deleteDamage, getCurrentHotel, getCurrentUser, getUsers } from '@/data/store';
import type { Damage, DamageStatus, DamagePriority, DamageCategory, Hotel, RepairImage, RepairItem } from '@/types';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageGallery } from '@/components/ImageGallery';

const categories: DamageCategory[] = ['plumbing', 'electrical', 'furniture', 'appliances', 'structural', 'hvac', 'painting', 'cleaning', 'other'];
const priorities: DamagePriority[] = ['low', 'medium', 'high', 'urgent'];
const statuses: DamageStatus[] = ['pending', 'in-progress', 'completed', 'cancelled'];

export function DamageTracker() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [handymen, setHandymen] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<DamageStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<DamageCategory | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDamage, setEditingDamage] = useState<Damage | null>(null);
  const [selectedDamage, setSelectedDamage] = useState<Damage | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    roomNumber: '',
    category: 'plumbing' as DamageCategory,
    description: '',
    priority: 'medium' as DamagePriority,
    status: 'pending' as DamageStatus,
    cost: '',
    hoursSpent: '',
    materials: '',
    notes: '',
    assignedTo: ''
  });
  const [images, setImages] = useState<RepairImage[]>([]);
  const [itemsUsed, setItemsUsed] = useState<RepairItem[]>([]);

  useEffect(() => {
    const currentHotel = getCurrentHotel();
    if (currentHotel) {
      setHotel(currentHotel);
      loadHotelData(currentHotel.id);
    }
  }, []);

  const loadHotelData = (hotelId: string) => {
    const allDamages = getDamages(hotelId);
    setDamages(allDamages);
    
    // Load all users as potential assignees
    const allUsers = getUsers();
    setHandymen(allUsers.map(u => u.name));
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      category: 'plumbing',
      description: '',
      priority: 'medium',
      status: 'pending',
      cost: '',
      hoursSpent: '',
      materials: '',
      notes: '',
      assignedTo: ''
    });
    setImages([]);
    setItemsUsed([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hotel) {
      toast.error('Please select a hotel first');
      return;
    }

    const currentUser = getCurrentUser();
    
    const hoursVal = parseFloat(formData.hoursSpent);
    const damageData = {
      hotelId: hotel.id,
      roomNumber: formData.roomNumber,
      category: formData.category,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      reportedDate: new Date().toISOString().split('T')[0],
      cost: parseFloat(formData.cost) || 0,
      hoursSpent: hoursVal > 0 ? hoursVal : undefined,
      materials: itemsUsed.length > 0
        ? itemsUsed.map(i => (i.brand ? `${i.name} (${i.brand})` : i.name))
        : formData.materials.split(',').map(m => m.trim()).filter(Boolean),
      itemsUsed: itemsUsed.length > 0 ? itemsUsed : undefined,
      notes: formData.notes,
      reportedBy: currentUser?.name || 'Handyman',
      assignedTo: formData.assignedTo || currentUser?.name || undefined,
      images: images.length > 0 ? images.map(img => ({ type: img.type, url: img.url, uploadedAt: img.uploadedAt })) : [],
      completedDate: formData.status === 'completed' ? new Date().toISOString().split('T')[0] : undefined
    };

    if (editingDamage) {
      updateDamage(editingDamage.id, damageData);
      toast.success('Repair updated successfully!');
      setEditingDamage(null);
    } else {
      addDamage(damageData);
      toast.success('New repair added successfully!');
    }

    resetForm();
    setIsAddDialogOpen(false);
    loadHotelData(hotel.id);
  };

  const handleEdit = (damage: Damage) => {
    setEditingDamage(damage);
    setFormData({
      roomNumber: damage.roomNumber,
      category: damage.category,
      description: damage.description,
      priority: damage.priority,
      status: damage.status,
      cost: damage.cost.toString(),
      hoursSpent: damage.hoursSpent != null ? damage.hoursSpent.toString() : '',
      materials: damage.materials.join(', '),
      notes: damage.notes,
      assignedTo: damage.assignedTo || ''
    });
    // Handle both old format (string[]) and new format (RepairImage[])
    if (damage.images && damage.images.length > 0) {
      if (typeof damage.images[0] === 'string') {
        // Convert old format to new format
        setImages((damage.images as string[]).map(url => ({
          type: 'before' as const,
          url,
          uploadedAt: new Date().toISOString()
        })));
      } else {
        setImages(damage.images as RepairImage[]);
      }
    } else {
      setImages([]);
    }
    setItemsUsed(damage.itemsUsed && damage.itemsUsed.length > 0 ? damage.itemsUsed : []);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this repair record?')) {
      deleteDamage(id);
      toast.success('Repair deleted successfully!');
      if (hotel) {
        loadHotelData(hotel.id);
      }
    }
  };

  const filteredDamages = damages.filter(damage => {
    const matchesSearch = 
      damage.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      damage.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      damage.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || damage.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || damage.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const STATUS_ORDER: Record<DamageStatus, number> = {
    pending: 0,
    'in-progress': 1,
    completed: 2,
    cancelled: 3
  };

  const sortedDamages = [...filteredDamages].sort((a, b) => {
    const orderA = STATUS_ORDER[a.status];
    const orderB = STATUS_ORDER[b.status];
    if (orderA !== orderB) return orderA - orderB;
    if (a.status === 'pending') {
      return new Date(a.reportedDate).getTime() - new Date(b.reportedDate).getTime();
    }
    if (a.status === 'completed') {
      const dateA = a.completedDate ? new Date(a.completedDate).getTime() : new Date(a.reportedDate).getTime();
      const dateB = b.completedDate ? new Date(b.completedDate).getTime() : new Date(b.reportedDate).getTime();
      return dateB - dateA;
    }
    if (a.status === 'in-progress') {
      return new Date(a.reportedDate).getTime() - new Date(b.reportedDate).getTime();
    }
    return new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <X className="w-4 h-4" />;
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
          <p className="text-sm text-gray-500">Damage Tracker</p>
        </div>
      </div>

      {/* Header Actions - Mobile Responsive */}
      <div className="space-y-3">
        {/* Search Bar - Full Width */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search repairs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        {/* Filters Row */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as DamageStatus | 'all')}>
            <SelectTrigger className="flex-1 min-w-[100px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as DamageCategory | 'all')}>
            <SelectTrigger className="flex-1 min-w-[100px]">
              <Wrench className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (open) {
                resetForm();
                setEditingDamage(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" className="flex-shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Repair</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingDamage ? 'Edit Repair' : 'Add New Repair'}</DialogTitle>
                <p className="text-sm text-gray-500">{hotel.name}</p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Input
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                      placeholder="e.g., 101"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({...formData, category: v as DamageCategory})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the issue..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(v) => setFormData({...formData, priority: v as DamagePriority})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => setFormData({...formData, status: v as DamageStatus})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hours spent</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      value={formData.hoursSpent}
                      onChange={(e) => setFormData({...formData, hoursSpent: e.target.value})}
                      placeholder="e.g. 1.5"
                    />
                    {formData.cost && formData.hoursSpent && parseFloat(formData.hoursSpent) > 0 && (
                      <p className="text-xs text-gray-500">
                        Internal rate: ${(parseFloat(formData.cost) / parseFloat(formData.hoursSpent)).toFixed(2)}/h
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Assigned To</Label>
                    <Select 
                      value={formData.assignedTo || '__unassigned__'} 
                      onValueChange={(v) => setFormData({...formData, assignedTo: v === '__unassigned__' ? '' : v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select handyman" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned__">Unassigned</SelectItem>
                        {handymen.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Materials (comma separated, or use items below)</Label>
                  <Input
                    value={formData.materials}
                    onChange={(e) => setFormData({...formData, materials: e.target.value})}
                    placeholder="e.g., screws, paint, bulbs"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Items used (name, brand, cost)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setItemsUsed([...itemsUsed, { name: '', brand: '', estimatedCost: undefined }])}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add item
                    </Button>
                  </div>
                  {itemsUsed.length > 0 && (
                    <div className="space-y-2 border rounded-md p-2 bg-gray-50">
                      {itemsUsed.map((item, idx) => (
                        <div key={idx} className="flex flex-wrap gap-2 items-center">
                          <Input
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => {
                              const next = [...itemsUsed];
                              next[idx] = { ...next[idx], name: e.target.value };
                              setItemsUsed(next);
                            }}
                            className="flex-1 min-w-[100px]"
                          />
                          <Input
                            placeholder="Brand"
                            value={item.brand}
                            onChange={(e) => {
                              const next = [...itemsUsed];
                              next[idx] = { ...next[idx], brand: e.target.value };
                              setItemsUsed(next);
                            }}
                            className="w-28"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Cost"
                            value={item.estimatedCost ?? ''}
                            onChange={(e) => {
                              const next = [...itemsUsed];
                              next[idx] = { ...next[idx], estimatedCost: e.target.value ? parseFloat(e.target.value) : undefined };
                              setItemsUsed(next);
                            }}
                            className="w-20"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setItemsUsed(itemsUsed.filter((_, i) => i !== idx))}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
                
                <div className="space-y-2">
                  <ImageUpload images={images} onChange={setImages} maxImages={10} />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1">
                    {editingDamage ? 'Update Repair' : 'Add Repair'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Repairs List */}
      <div className="space-y-3">
        {filteredDamages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No repairs found at {hotel.name}</p>
              <p className="text-sm text-gray-400 mt-1">Add a new repair to get started</p>
            </CardContent>
          </Card>
        ) : (
          sortedDamages.map((damage) => (
            <Card
              key={damage.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedDamage(damage)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">Room {damage.roomNumber}</h3>
                      <Badge className={getPriorityColor(damage.priority)}>
                        {damage.priority}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {getStatusIcon(damage.status)}
                        <span className="ml-1">{damage.status}</span>
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-1 capitalize">{damage.category}</p>
                    <p className="text-gray-800 mt-2">{damage.description}</p>
                    
                    {damage.itemsUsed && damage.itemsUsed.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {damage.itemsUsed.map((item, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {item.brand ? `${item.name} (${item.brand})` : item.name}
                            {item.estimatedCost != null ? ` — ${formatCurrency(item.estimatedCost)}` : ''}
                          </span>
                        ))}
                      </div>
                    ) : damage.materials.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {damage.materials.map((material, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {material}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                      <span>Reported: {format(new Date(damage.reportedDate), 'MMM d, yyyy')}</span>
                      {damage.assignedTo && <span>Assigned: {damage.assignedTo}</span>}
                      {damage.cost > 0 && <span className="font-medium text-gray-700">{formatCurrency(damage.cost)}</span>}
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(damage)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(damage.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
                  {selectedDamage.lastEditedAt && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      Last edited: {format(parseISO(selectedDamage.lastEditedAt), 'MMM d, yyyy HH:mm')}
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
