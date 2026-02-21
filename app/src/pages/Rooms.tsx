// Hotel Maintenance Pro - Rooms Page (Hotel-specific)

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Building2,
  Home,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRooms, getCurrentHotel, updateRoom, getDamages } from '@/data/store';
import type { Room, Hotel, RoomStatus } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Rooms() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<RoomStatus | 'all'>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const currentHotel = getCurrentHotel();
    if (currentHotel) {
      setHotel(currentHotel);
      loadHotelData(currentHotel.id);
    }
  }, []);

  const loadHotelData = (hotelId: string) => {
    const hotelRooms = getRooms(hotelId);
    setRooms(hotelRooms);
  };

  const handleStatusChange = (room: Room, newStatus: RoomStatus) => {
    const updated = updateRoom(room.hotelId, room.number, { status: newStatus });
    if (updated) {
      toast.success(`Room ${room.number} status updated to ${newStatus}`);
      if (hotel) {
        loadHotelData(hotel.id);
      }
    }
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-200';
      case 'occupied': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'out-of-order': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'occupied': return <Home className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'out-of-order': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    const matchesFloor = filterFloor === 'all' || room.floor.toString() === filterFloor;
    const matchesType = filterType === 'all' || room.type === filterType;
    
    return matchesSearch && matchesStatus && matchesFloor && matchesType;
  });

  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b);
  const types = Array.from(new Set(rooms.map(r => r.type))).sort();

  const getRoomMaintenanceHistory = (roomNumber: string) => {
    if (!hotel) return [];
    const damages = getDamages(hotel.id);
    return damages.filter(d => d.roomNumber === roomNumber)
      .sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime())
      .slice(0, 5);
  };

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setIsDetailsOpen(true);
  };

  const statusCounts = {
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
    'out-of-order': rooms.filter(r => r.status === 'out-of-order').length,
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
          <p className="text-sm text-gray-500">Room Management</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Rooms</p>
            <p className="text-2xl font-bold">{rooms.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">In Maintenance</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.maintenance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Out of Order</p>
            <p className="text-2xl font-bold text-red-600">{statusCounts['out-of-order']}</p>
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
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as RoomStatus | 'all')}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out-of-order">Out of Order</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterFloor} onValueChange={setFilterFloor}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {floors.map(floor => (
                    <SelectItem key={floor} value={floor.toString()}>
                      Floor {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No rooms found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRooms.map((room) => {
            const maintenanceHistory = getRoomMaintenanceHistory(room.number);
            return (
              <Card key={`${room.hotelId}-${room.number}`} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">Room {room.number}</h3>
                        <Badge className={getStatusColor(room.status)}>
                          {getStatusIcon(room.status)}
                          <span className="ml-1 capitalize">{room.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span>Floor {room.floor}</span>
                        <span className="capitalize">{room.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  {maintenanceHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Recent Maintenance:</p>
                      <div className="space-y-1">
                        {maintenanceHistory.slice(0, 2).map((damage) => (
                          <div key={damage.id} className="text-xs text-gray-600 flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            <span className="capitalize">{damage.category}</span>
                            <span className="text-gray-400">•</span>
                            <span>{format(new Date(damage.reportedDate), 'MMM d')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(room)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    <Select 
                      value={room.status} 
                      onValueChange={(v) => handleStatusChange(room, v as RoomStatus)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="out-of-order">Out of Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Room Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Room {selectedRoom?.number} Details</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Room Number</p>
                  <p className="font-semibold">{selectedRoom.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Floor</p>
                  <p className="font-semibold">Floor {selectedRoom.floor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-semibold capitalize">{selectedRoom.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={getStatusColor(selectedRoom.status)}>
                    {getStatusIcon(selectedRoom.status)}
                    <span className="ml-1 capitalize">{selectedRoom.status}</span>
                  </Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold mb-3">Maintenance History</h4>
                {getRoomMaintenanceHistory(selectedRoom.number).length === 0 ? (
                  <p className="text-sm text-gray-500">No maintenance records for this room</p>
                ) : (
                  <div className="space-y-2">
                    {getRoomMaintenanceHistory(selectedRoom.number).map((damage) => (
                      <div key={damage.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{damage.category}</span>
                          <Badge variant="outline" className="capitalize">{damage.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{damage.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{format(new Date(damage.reportedDate), 'MMM d, yyyy')}</span>
                          {damage.completedDate && (
                            <span>Completed: {format(new Date(damage.completedDate), 'MMM d, yyyy')}</span>
                          )}
                          {damage.cost > 0 && (
                            <span>Cost: ${damage.cost.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
