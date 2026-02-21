// Hotel Maintenance Pro - Header Component

import { 
  LayoutDashboard, 
  Wrench, 
  History, 
  BarChart3, 
  Menu,
  X,
  Building2,
  LogOut,
  ArrowRightLeft,
  Settings,
  Shield,
  Home,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { getCurrentUser, getCurrentHotel, logout, canManageUsers } from '@/data/store';
import type { User } from '@/types';
import type { Hotel } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Page = 'dashboard' | 'damages' | 'history' | 'reports' | 'rooms' | 'preventive';

interface HeaderProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  isMobile: boolean;
  onSwitchHotel: () => void;
  onAdminSettings: () => void;
}

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'damages', label: 'Damage Tracker', icon: Wrench },
  { id: 'history', label: 'History', icon: History },
  { id: 'rooms', label: 'Rooms', icon: Home },
  { id: 'preventive', label: 'Preventive', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export function Header({ currentPage, onPageChange, isMobile, onSwitchHotel, onAdminSettings }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentHotel, setCurrentHotel] = useState<Hotel | null>(null);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setCanAccessAdmin(user ? canManageUsers(user) : false);
    setCurrentHotel(getCurrentHotel());
  }, []);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const getRoleIcon = (role: string) => {
    if (role === 'superadmin') return <Shield className="w-3 h-3 text-red-500" />;
    if (role === 'admin') return <Shield className="w-3 h-3 text-blue-500" />;
    return null;
  };

  if (isMobile) {
    return (
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentHotel?.image ? (
            <img src={currentHotel.image} alt={currentHotel.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: currentHotel?.color || '#3b82f6' }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-sm text-gray-900 leading-tight truncate max-w-[120px]">
              {currentHotel?.name || 'Hotel'}
            </h1>
            <p className="text-xs text-gray-500">{currentUser?.name?.split(' ')[0] || 'User'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSwitchHotel}
            title="Switch Hotel"
          >
            <ArrowRightLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
        
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
            
            {canAccessAdmin && (
              <button
                onClick={() => {
                  onAdminSettings();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Admin Settings</span>
              </button>
            )}
            
            <div className="border-t border-gray-200 p-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col">
        {/* Hotel Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {currentHotel?.image ? (
              <img src={currentHotel.image} alt={currentHotel.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: currentHotel?.color || '#3b82f6' }}
              >
                <Building2 className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-gray-900 leading-tight truncate">
                {currentHotel?.name || 'Hotel'}
              </h1>
              <p className="text-xs text-gray-500">{currentUser?.name || 'User'}</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3 text-xs"
            onClick={onSwitchHotel}
          >
            <ArrowRightLeft className="w-3 h-3 mr-1" />
            Switch Hotel
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {canAccessAdmin && (
            <button
              onClick={onAdminSettings}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all text-gray-600 hover:bg-gray-100"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Admin Settings</span>
            </button>
          )}
        </nav>
        
        {/* User Menu */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: currentUser?.color || '#3b82f6' }}
                >
                  {currentUser?.avatar && (currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http')) ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.avatar || currentUser?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium truncate">{currentUser?.name || 'User'}</p>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(currentUser?.role || '')}
                    <p className="text-xs text-gray-500 capitalize">{currentUser?.role || 'Handyman'}</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSwitchHotel}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Switch Hotel
              </DropdownMenuItem>
              {canAccessAdmin && (
                <DropdownMenuItem onClick={onAdminSettings}>
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      
      {/* Desktop Header */}
      <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 z-40 px-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          {navItems.find(item => item.id === currentPage)?.label}
        </h2>
        <div className="flex items-center gap-4">
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: currentHotel?.color || '#3b82f6' }}
          >
            {currentHotel?.name || 'Hotel'}
          </div>
        </div>
      </header>
    </>
  );
}
