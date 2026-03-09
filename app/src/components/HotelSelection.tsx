// Hotel Maintenance Pro - Hotel Selection Screen

import { useEffect, useState } from 'react';
import { LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHotels, setCurrentHotel, getCurrentUser, logout } from '@/data/store';
import type { Hotel } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HotelSelectionProps {
  onHotelSelected: () => void;
  onLogout: () => void;
}

export function HotelSelection({ onHotelSelected, onLogout }: HotelSelectionProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const allHotels = getHotels();
    setHotels(allHotels);
    
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user.name);
      setUserRole(user.role);
    }
  }, []);

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId);

  const handleAccess = async () => {
    if (!selectedHotel) return;
    setIsLoading(true);
    try {
      await setCurrentHotel(selectedHotel);
      onHotelSelected();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
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
        <Button variant="ghost" size="sm" onClick={handleLogoutClick}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out</AlertDialogTitle>
            <AlertDialogDescription>Do you want to log out?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm}>Accept</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Welcome */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Hello, {currentUser}!
        </h2>
        <div className="mt-2 flex justify-center">{getRoleBadge()}</div>
        <p className="text-gray-600 mt-3">Which hotel are you working at today?</p>
      </div>

      {/* Hotel dropdown + Access button */}
      <div className="w-full max-w-md space-y-4">
        <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
          <SelectTrigger className="w-full h-12 text-base bg-white border-2 border-gray-200 hover:border-blue-300">
            <SelectValue placeholder="Elige un hotel..." />
          </SelectTrigger>
          <SelectContent>
            {hotels.map((hotel) => (
              <SelectItem key={hotel.id} value={hotel.id} className="py-3">
                <span className="font-medium">{hotel.name}</span>
                {hotel.address ? (
                  <span className="block text-xs text-gray-500 truncate">{hotel.address}</span>
                ) : null}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hotels.length === 0 ? (
          <p className="text-sm text-amber-600 text-center">No hay hoteles disponibles.</p>
        ) : (
          <Button
            className="w-full h-12 text-base gap-2"
            size="lg"
            onClick={handleAccess}
            disabled={!selectedHotel || isLoading}
          >
            <LogIn className="w-5 h-5" />
            {isLoading ? 'Entrando...' : 'Acceder'}
          </Button>
        )}
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
