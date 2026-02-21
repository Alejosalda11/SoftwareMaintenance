// Hotel Maintenance Pro - Preventive Maintenance Schedule Page

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Home,
  Edit2,
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  getPreventiveMaintenance, 
  addPreventiveMaintenance, 
  updatePreventiveMaintenance, 
  deletePreventiveMaintenance,
  getCurrentHotel,
  getUsers,
  getRooms
} from '@/data/store';
import type { PreventiveMaintenance, Hotel, DamageCategory, PreventiveFrequency, PreventiveStatus, Room } from '@/types';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { toast } from 'sonner';

const categories: DamageCategory[] = ['plumbing', 'electrical', 'furniture', 'appliances', 'structural', 'hvac', 'painting', 'cleaning', 'other'];
const frequencies: PreventiveFrequency[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

export function PreventiveSchedule() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [preventiveTasks, setPreventiveTasks] = useState<PreventiveMaintenance[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [handymen, setHandymen] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PreventiveStatus | 'all'>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<DamageCategory | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PreventiveMaintenance | null>(null);
  const [_viewMode, _setViewMode] = useState<'list' | 'calendar'>('list');

  // Form state
  const [formData, setFormData] = useState({
    roomNumber: '',
    category: 'plumbing' as DamageCategory,
    title: '',
    description: '',
    frequency: 'monthly' as PreventiveFrequency,
    nextDueDate: format(new Date(), 'yyyy-MM-dd'),
    assignedTo: ''
  });

  useEffect(() => {
    const currentHotel = getCurrentHotel();
    if (currentHotel) {
      setHotel(currentHotel);
      loadHotelData(currentHotel.id);
    }
  }, []);

  const loadHotelData = (hotelId: string) => {
    const tasks = getPreventiveMaintenance(hotelId);
    setPreventiveTasks(tasks);
    
    const hotelRooms = getRooms(hotelId);
    setRooms(hotelRooms);
    
    const allUsers = getUsers();
    setHandymen(allUsers.map(u => u.name));
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      category: 'plumbing',
      title: '',
      description: '',
      frequency: 'monthly',
      nextDueDate: format(new Date(), 'yyyy-MM-dd'),
      assignedTo: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hotel) {
      toast.error('Please select a hotel first');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const taskData: Omit<PreventiveMaintenance, 'id'> = {
      hotelId: hotel.id,
      roomNumber: formData.roomNumber || undefined,
      category: formData.category,
      title: formData.title,
      description: formData.description,
      frequency: formData.frequency,
      nextDueDate: formData.nextDueDate,
      assignedTo: formData.assignedTo || undefined,
      status: 'pending'
    };

    if (editingTask) {
      updatePreventiveMaintenance(editingTask.id, taskData);
      toast.success('Preventive maintenance task updated successfully!');
      setEditingTask(null);
    } else {
      addPreventiveMaintenance(taskData);
      toast.success('Preventive maintenance task added successfully!');
    }

    resetForm();
    setIsAddDialogOpen(false);
    loadHotelData(hotel.id);
  };

  const handleEdit = (task: PreventiveMaintenance) => {
    setEditingTask(task);
    setFormData({
      roomNumber: task.roomNumber || '',
      category: task.category,
      title: task.title,
      description: task.description,
      frequency: task.frequency,
      nextDueDate: task.nextDueDate,
      assignedTo: task.assignedTo || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this preventive maintenance task?')) {
      deletePreventiveMaintenance(id);
      toast.success('Task deleted successfully!');
      if (hotel) {
        loadHotelData(hotel.id);
      }
    }
  };

  const handleComplete = (task: PreventiveMaintenance) => {
    updatePreventiveMaintenance(task.id, { status: 'completed' });
    toast.success('Task marked as completed!');
    if (hotel) {
      loadHotelData(hotel.id);
    }
  };

  const getStatusColor = (status: PreventiveStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: PreventiveStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredTasks = preventiveTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.roomNumber && task.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesRoom = filterRoom === 'all' || task.roomNumber === filterRoom || (!task.roomNumber && filterRoom === 'hotel-wide');
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesRoom && matchesCategory;
  });

  const overdueCount = preventiveTasks.filter(t => t.status === 'overdue').length;
  const inProgressCount = preventiveTasks.filter(t => t.status === 'in-progress').length;

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
          <p className="text-sm text-gray-500">Preventive Maintenance Schedule</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Tasks</p>
            <p className="text-2xl font-bold">{preventiveTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
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
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as PreventiveStatus | 'all')}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger className="w-36">
                  <Home className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  <SelectItem value="hotel-wide">Hotel-wide</SelectItem>
                  {rooms.map(room => (
                    <SelectItem key={room.number} value={room.number}>
                      Room {room.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as DamageCategory | 'all')}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <Button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setEditingTask(null);
                    setIsAddDialogOpen(true);
                  }}
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTask ? 'Edit Preventive Task' : 'Add Preventive Task'}</DialogTitle>
                    <p className="text-sm text-gray-500">{hotel.name}</p>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g., AC Filter Replacement"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
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
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select 
                          value={formData.frequency} 
                          onValueChange={(v) => setFormData({...formData, frequency: v as PreventiveFrequency})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencies.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Room (optional)</Label>
                        <Select 
                          value={formData.roomNumber || '__hotel-wide__'} 
                          onValueChange={(v) => setFormData({...formData, roomNumber: v === '__hotel-wide__' ? '' : v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Hotel-wide" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__hotel-wide__">Hotel-wide</SelectItem>
                            {rooms.map(room => (
                              <SelectItem key={room.number} value={room.number}>
                                Room {room.number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Next Due Date</Label>
                        <Input
                          type="date"
                          value={formData.nextDueDate}
                          onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Assigned To (optional)</Label>
                      <Select 
                        value={formData.assignedTo || '__unassigned__'} 
                        onValueChange={(v) => setFormData({...formData, assignedTo: v === '__unassigned__' ? '' : v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__unassigned__">Unassigned</SelectItem>
                          {handymen.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Describe the preventive maintenance task..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1">
                        {editingTask ? 'Update Task' : 'Add Task'}
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
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No preventive maintenance tasks found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const dueDate = parseISO(task.nextDueDate);
            const isOverdue = isPast(dueDate) && !isToday(dueDate) && task.status !== 'completed';
            
            return (
              <Card key={task.id} className={`overflow-hidden ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1 capitalize">{task.status}</span>
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {task.frequency}
                        </Badge>
                        {task.roomNumber && (
                          <Badge variant="outline">
                            <Home className="w-3 h-3 mr-1" />
                            Room {task.roomNumber}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <span className="capitalize">{task.category}</span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-800 mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          Due: {format(dueDate, 'MMM d, yyyy')}
                        </span>
                        {task.lastCompletedDate && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Last: {format(parseISO(task.lastCompletedDate), 'MMM d, yyyy')}
                          </span>
                        )}
                        {task.assignedTo && (
                          <span className="flex items-center gap-1">
                            Assigned: {task.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col gap-2">
                      {task.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleComplete(task)}
                          className="text-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
