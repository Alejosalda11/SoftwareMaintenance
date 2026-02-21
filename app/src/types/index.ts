// Hotel Maintenance Pro - TypeScript Types

export type DamageStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type DamagePriority = 'low' | 'medium' | 'high' | 'urgent';
export type DamageCategory = 
  | 'plumbing' 
  | 'electrical' 
  | 'furniture' 
  | 'appliances' 
  | 'structural' 
  | 'hvac' 
  | 'painting' 
  | 'cleaning' 
  | 'other';

export type UserRole = 'superadmin' | 'admin' | 'handyman';

export interface Hotel {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  color: string;
  image?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email?: string;
  password?: string; // Hashed password
  color: string;
  avatar?: string;
  canDelete?: boolean;
}

export interface RepairImage {
  type: 'before' | 'after';
  url: string; // base64 data URL or file path
  uploadedAt: string;
}

export interface Damage {
  id: string;
  hotelId: string;
  roomNumber: string;
  category: DamageCategory;
  description: string;
  status: DamageStatus;
  priority: DamagePriority;
  reportedDate: string;
  completedDate?: string;
  cost: number;
  materials: string[];
  notes: string;
  reportedBy: string;
  assignedTo?: string;
  images: string[] | RepairImage[]; // Support both old format (string[]) and new format (RepairImage[])
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'out-of-order';

export interface Room {
  hotelId: string;
  number: string;
  floor: number;
  type: string;
  status: RoomStatus;
}

export interface MaintenanceStats {
  totalRepairs: number;
  pendingRepairs: number;
  completedThisMonth: number;
  totalExpenses: number;
  averageRepairCost: number;
}

export interface CategoryStats {
  category: DamageCategory;
  count: number;
  totalCost: number;
}

export interface MonthlyStats {
  month: string;
  repairs: number;
  expenses: number;
}

export interface Handyman {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: DamageCategory[];
}

export type PreventiveFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PreventiveStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';

export interface PreventiveMaintenance {
  id: string;
  hotelId: string;
  roomNumber?: string; // optional - can be hotel-wide
  category: DamageCategory;
  title: string;
  description: string;
  frequency: PreventiveFrequency;
  nextDueDate: string;
  lastCompletedDate?: string;
  assignedTo?: string;
  status: PreventiveStatus;
}
