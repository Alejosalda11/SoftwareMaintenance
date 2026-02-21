// Hotel Maintenance Pro - User Selection Screen

import { useEffect, useState } from 'react';
import { Hotel, Settings, Shield, UserCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUsers, getCurrentUser, setCurrentUser, canManageUsers } from '@/data/store';
import type { User } from '@/types';

interface UserSelectionProps {
  onUserSelected: () => void;
  onAdminSettings: () => void;
}

export function UserSelection({ onUserSelected, onAdminSettings }: UserSelectionProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAdminButton, setShowAdminButton] = useState(false);

  useEffect(() => {
    const allUsers = getUsers();
    setUsers(allUsers);
    
    // Check if there's already a saved user
    const savedUser = getCurrentUser();
    if (savedUser) {
      setSelectedUser(savedUser);
      setShowAdminButton(canManageUsers(savedUser));
    }
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setCurrentUser(user);
    setShowAdminButton(canManageUsers(user));
  };

  const handleContinue = () => {
    if (selectedUser) {
      onUserSelected();
    }
  };

  const getRoleBadge = (user: User) => {
    if (user.role === 'superadmin') {
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
          <Shield className="w-3 h-3" />
          Super Admin
        </span>
      );
    }
    if (user.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          <Shield className="w-3 h-3" />
          Admin
        </span>
      );
    }
    return (
      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
        Handyman
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Hotel className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Hotel Maintenance Pro</h1>
        <p className="text-gray-600 mt-2">Select your name to continue</p>
      </div>

      {/* User Cards */}
      <div className="w-full max-w-md space-y-3">
        {users.map((user) => (
          <Card
            key={user.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedUser?.id === user.id
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleSelectUser(user)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden flex-shrink-0"
                style={{ backgroundColor: user.color }}
              >
                {user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http')) ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.avatar || user.name.split(' ').map((n: string) => n[0]).join('')
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                <div className="mt-1">{getRoleBadge(user)}</div>
              </div>
              <UserCircle className={`w-6 h-6 ${
                selectedUser?.id === user.id ? 'text-blue-500' : 'text-gray-300'
              }`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      {selectedUser && (
        <div className="mt-8 w-full max-w-md space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleContinue}
          >
            Continue as {selectedUser.name}
          </Button>
          
          {showAdminButton && (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={onAdminSettings}
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin Settings
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-500">
        Hotel Maintenance Pro v1.0
      </p>
    </div>
  );
}
