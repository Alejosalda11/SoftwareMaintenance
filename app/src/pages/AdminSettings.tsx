// Hotel Maintenance Pro - Admin Settings Page

import { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  Shield, 
  Save,
  X,
  AlertTriangle,
  Phone,
  Mail,
  Lock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUsers, getHotels, addUser, updateUser, deleteUser, addHotel, updateHotel, deleteHotel, getCurrentUser, canDeleteUser, canManageUsers } from '@/data/store';
import { hashPassword, isSupabaseAuth } from '@/lib/auth';
import type { User, Hotel, UserRole } from '@/types';
import { toast } from 'sonner';
import { SingleImageUpload } from '@/components/SingleImageUpload';

interface AdminSettingsProps {
  onBack: () => void;
}

const userRoles: { value: UserRole; label: string; description: string }[] = [
  { value: 'superadmin', label: 'Super Admin', description: 'Full access - can delete everything' },
  { value: 'admin', label: 'Admin', description: 'Can manage users and hotels, but cannot delete' },
  { value: 'handyman', label: 'Handyman', description: 'Can only use the app, no admin access' },
];

const colors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export function AdminSettings({ onBack }: AdminSettingsProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  
  // User dialog state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    role: 'handyman' as UserRole,
    phone: '',
    email: '',
    password: '',
    color: colors[0],
    avatarImage: '', // data URL or http URL
    avatarInitials: '', // e.g. "JD" when no image
  });
  
  // Hotel dialog state
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [hotelForm, setHotelForm] = useState({
    name: '',
    address: '',
    totalRooms: 100,
    color: colors[0],
    image: ''
  });

  useEffect(() => {
    const cu = getCurrentUser();
    setCurrentUser(cu);
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(getUsers());
    setHotels(getHotels());
  };

  // ==================== USER MANAGEMENT ====================

  const openUserDialog = (user?: User) => {
    if (user) {
      const isImg = user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http'));
      setEditingUser(user);
      setUserForm({
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email || '',
        password: '',
        color: user.color,
        avatarImage: isImg ? user.avatar ?? '' : '',
        avatarInitials: isImg ? '' : (user.avatar ?? '')
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        role: 'handyman',
        phone: '',
        email: '',
        password: '',
        color: colors[0],
        avatarImage: '',
        avatarInitials: ''
      });
    }
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!userForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editingUser && !userForm.password.trim()) {
      toast.error('Password is required for new users');
      return;
    }
    if (!editingUser && isSupabaseAuth() && userForm.password.trim().length < 6) {
      toast.error('With Supabase, password must be at least 6 characters');
      return;
    }

    const avatar = userForm.avatarImage || userForm.avatarInitials || userForm.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();

    const userData: Partial<User> & { name: string; role: UserRole; phone: string; email?: string; color: string; avatar?: string; password?: string } = {
      name: userForm.name,
      role: userForm.role,
      phone: userForm.phone,
      email: userForm.email || undefined,
      color: userForm.color,
      avatar
    };
    if (editingUser && userForm.password.trim()) {
      userData.password = hashPassword(userForm.password);
    }
    if (!editingUser) {
      userData.password = isSupabaseAuth() ? userForm.password.trim() : hashPassword(userForm.password);
    }

    if (editingUser) {
      updateUser(editingUser.id, userData);
      toast.success('User updated successfully!');
    } else {
      addUser(userData as Omit<User, 'id'>);
      toast.success('User created successfully!');
      if (isSupabaseAuth()) {
        toast.info('Si no puede iniciar sesión, en Supabase desactiva "Confirm email" en Authentication > Providers > Email.', { duration: 6000 });
      }
    }

    setIsUserDialogOpen(false);
    refreshData();
  };

  const handleDeleteUser = (user: User) => {
    if (!currentUser) return;
    
    if (!canDeleteUser(currentUser, user)) {
      toast.error('Only Super Admin can delete users');
      return;
    }

    if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      const success = deleteUser(user.id, currentUser);
      if (success) {
        toast.success('User deleted successfully!');
        refreshData();
      } else {
        toast.error('Failed to delete user');
      }
    }
  };

  // ==================== HOTEL MANAGEMENT ====================

  const openHotelDialog = (hotel?: Hotel) => {
    if (hotel) {
      setEditingHotel(hotel);
      setHotelForm({
        name: hotel.name,
        address: hotel.address,
        totalRooms: hotel.totalRooms,
        color: hotel.color,
        image: hotel.image || ''
      });
    } else {
      setEditingHotel(null);
      setHotelForm({
        name: '',
        address: '',
        totalRooms: 100,
        color: colors[0],
        image: ''
      });
    }
    setIsHotelDialogOpen(true);
  };

  const handleSaveHotel = () => {
    if (!hotelForm.name.trim()) {
      toast.error('Hotel name is required');
      return;
    }

    if (editingHotel) {
      updateHotel(editingHotel.id, hotelForm);
      toast.success('Hotel updated successfully!');
    } else {
      addHotel(hotelForm);
      toast.success('Hotel created successfully!');
    }

    setIsHotelDialogOpen(false);
    refreshData();
  };

  const handleDeleteHotel = (hotel: Hotel) => {
    if (!currentUser) return;
    
    if (confirm(`Are you sure you want to delete ${hotel.name}? This will also delete all associated repairs.`)) {
      const success = deleteHotel(hotel.id, currentUser);
      if (success) {
        toast.success('Hotel deleted successfully!');
        refreshData();
      } else {
        toast.error('Failed to delete hotel');
      }
    }
  };

  // ==================== RENDER HELPERS ====================

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-700 border-red-200';
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'handyman': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!currentUser || !canManageUsers(currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to access admin settings.</p>
        <Button className="mt-4" onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Admin Settings</h2>
            <p className="text-gray-500">Manage users and hotels</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium capitalize">{currentUser.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Hotels ({hotels.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">User Management</h3>
            <Button onClick={() => openUserDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http')) ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.avatar || user.name.split(' ').map((n: string) => n[0]).join('')
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{user.name}</h4>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </span>
                        )}
                        {user.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openUserDialog(user)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {canDeleteUser(currentUser, user) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Hotels Tab */}
        <TabsContent value="hotels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Hotel Management</h3>
            <Button onClick={() => openHotelDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Hotel
            </Button>
          </div>

          <div className="grid gap-4">
            {hotels.map((hotel) => (
              <Card key={hotel.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {hotel.image ? (
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${hotel.color}20` }}
                      >
                        <Building2 className="w-7 h-7" style={{ color: hotel.color }} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{hotel.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{hotel.address}</span>
                        <Badge variant="secondary">{hotel.totalRooms} rooms</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openHotelDialog(hotel)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteHotel(hotel)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={userForm.role} 
                onValueChange={(v) => setUserForm({ ...userForm, role: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {userForm.role === 'superadmin' && currentUser.role !== 'superadmin' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  Only Super Admin can create other Super Admin accounts.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="555-0100"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@hotel.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {editingUser ? 'New password (leave blank to keep current)' : 'Password'}
              </Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder={editingUser ? '••••••••' : 'Required for new users'}
                autoComplete={editingUser ? 'new-password' : 'new-password'}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Avatar Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setUserForm({ ...userForm, color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      userForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <SingleImageUpload
              label="Profile photo"
              value={userForm.avatarImage}
              onChange={(url) => setUserForm({ ...userForm, avatarImage: url })}
            />
            <div className="space-y-2">
              <Label>Avatar initials (if no photo)</Label>
              <Input
                value={userForm.avatarInitials}
                onChange={(e) => setUserForm({ ...userForm, avatarInitials: e.target.value.toUpperCase() })}
                placeholder="JD"
                maxLength={3}
              />
              <p className="text-xs text-gray-500">
                Shown when no profile photo is set; leave empty to use name initials
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveUser} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {editingUser ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hotel Dialog */}
      <Dialog open={isHotelDialogOpen} onOpenChange={setIsHotelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</DialogTitle>
            <DialogDescription>
              {editingHotel ? 'Update hotel information' : 'Create a new hotel'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hotel Name</Label>
              <Input
                value={hotelForm.name}
                onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                placeholder="Hotel Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={hotelForm.address}
                onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Total Rooms</Label>
              <Input
                type="number"
                value={hotelForm.totalRooms}
                onChange={(e) => setHotelForm({ ...hotelForm, totalRooms: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Brand Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setHotelForm({ ...hotelForm, color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      hotelForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <SingleImageUpload
              label="Logo"
              placeholder="Upload hotel logo"
              aspectRatio="video"
              value={hotelForm.image}
              onChange={(url) => setHotelForm({ ...hotelForm, image: url })}
            />
            
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveHotel} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {editingHotel ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setIsHotelDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
