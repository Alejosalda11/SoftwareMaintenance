// Hotel Maintenance Pro - Hotel Selection Screen

import { useEffect, useState } from 'react';
import { MapPin, LogOut, Hotel as HotelIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHotels, setCurrentHotel, getCurrentUser, logout } from '@/data/store';
import type { Hotel } from '@/types';

interface HotelSelectionProps {
  onHotelSelected: () => void;
  onLogout: () => void;
}

export function HotelSelection({ onHotelSelected, onLogout }: HotelSelectionProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const allHotels = getHotels();
    setHotels(allHotels);
    
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user.name);
      setUserRole(user.role);
    }
  }, []);

  const handleSelectHotel = async (hotel: Hotel) => {
    await setCurrentHotel(hotel);
    onHotelSelected();
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const getRoleBadge = () => {
    if (userRole === 'superadmin') {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          Super Admin
        </Badge>
      );
    }
    if (userRole === 'admin') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          Admin
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        Handyman
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      {/* Header: solo Logout (no se puede volver a cambiar de usuario) */}
      <div className="w-full max-w-md mb-6 flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Welcome */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Hello, {currentUser}!
        </h2>
        <div className="mt-2 flex justify-center">{getRoleBadge()}</div>
        <p className="text-gray-600 mt-3">Which hotel are you working at today?</p>
      </div>

      {/* Hotel Cards */}
      <div className="w-full max-w-md space-y-3">
        {hotels.map((hotel) => (
          <Card
            key={hotel.id}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 border-transparent hover:border-blue-300"
            onClick={() => handleSelectHotel(hotel)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {hotel.image ? (
                  <img 
                    src={hotel.image} 
                    alt={hotel.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${hotel.color}20` }}
                  >
                    <HotelIcon className="w-8 h-8" style={{ color: hotel.color }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {hotel.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{hotel.address}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{hotel.totalRooms} rooms</Badge>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: hotel.color }}
                      title="Hotel brand color"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          You can switch hotels anytime from the menu
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-500">
        Hotel Maintenance Pro v1.0
      </p>
    </div>
  );
}
