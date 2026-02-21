// Hotel Maintenance Pro - Dashboard Page (Hotel-specific)

import { useState, useEffect } from 'react';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Calendar,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDamages, getMaintenanceStats, getRooms, getCurrentHotel } from '@/data/store';
import type { Damage, Hotel } from '@/types';
import { format } from 'date-fns';

export function Dashboard() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [stats, setStats] = useState({
    totalRepairs: 0,
    pendingRepairs: 0,
    completedThisMonth: 0,
    totalExpenses: 0,
    averageRepairCost: 0
  });
  const [recentDamages, setRecentDamages] = useState<Damage[]>([]);
  const [roomsInMaintenance, setRoomsInMaintenance] = useState(0);

  useEffect(() => {
    const currentHotel = getCurrentHotel();
    if (currentHotel) {
      setHotel(currentHotel);
      loadHotelData(currentHotel.id);
    }
  }, []);

  const loadHotelData = (hotelId: string) => {
    const maintenanceStats = getMaintenanceStats(hotelId);
    setStats(maintenanceStats);
    
    const damages = getDamages(hotelId);
    const sorted = damages
      .sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime())
      .slice(0, 5);
    setRecentDamages(sorted);
    
    const rooms = getRooms(hotelId);
    setRoomsInMaintenance(rooms.filter(r => r.status === 'maintenance').length);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
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
    <div className="space-y-6">
      {/* Hotel Welcome Section */}
      <div 
        className="rounded-2xl p-6 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${hotel.color} 0%, ${hotel.color}dd 100%)` 
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-6 h-6" />
          <span className="text-white/80 text-sm font-medium">Current Hotel</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">{hotel.name}</h2>
        <p className="text-white/90 mb-4">
          You have {stats.pendingRepairs} pending repairs and {roomsInMaintenance} rooms under maintenance.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(), 'MMMM d, yyyy')}
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            <Wrench className="w-3 h-3 mr-1" />
            {stats.totalRepairs} Total Repairs
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            <Building2 className="w-3 h-3 mr-1" />
            {hotel.totalRooms} Rooms
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: hotel.color }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Repairs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRepairs}</p>
              </div>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${hotel.color}20` }}
              >
                <Wrench className="w-5 h-5" style={{ color: hotel.color }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRepairs}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedThisMonth}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rooms Under Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">{roomsInMaintenance}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Repair Cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageRepairCost)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalRepairs > 0 
                  ? Math.round(((stats.totalRepairs - stats.pendingRepairs) / stats.totalRepairs) * 100) 
                  : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Repairs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Repairs at {hotel.name}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '#/history'}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDamages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No repairs recorded yet for this hotel</p>
            ) : (
              recentDamages.map((damage) => (
                <div 
                  key={damage.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      damage.status === 'completed' ? 'bg-green-100' :
                      damage.status === 'in-progress' ? 'bg-blue-100' : 'bg-yellow-100'
                    }`}>
                      <Wrench className={`w-5 h-5 ${
                        damage.status === 'completed' ? 'text-green-600' :
                        damage.status === 'in-progress' ? 'text-blue-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Room {damage.roomNumber}</p>
                      <p className="text-sm text-gray-500 capitalize">{damage.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getPriorityColor(damage.priority)}>
                      {damage.priority}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(damage.reportedDate), 'MMM d')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
