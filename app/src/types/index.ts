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

/** External hourly rates (AUD/h) per category - Sydney NSW 2026 reference. */
export type ExternalRates = Record<DamageCategory, number>;

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

export interface RepairItem {
  name: string;
  brand: string;
  estimatedCost?: number;
}

/** One line of work inside a room repair order */
export interface RepairWorkItem {
  id: string;
  category: DamageCategory;
  description: string;
  status: DamageStatus;
  images: RepairImage[];
  cost?: number;
  notes?: string;
  completedDate?: string;
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
  itemsUsed?: RepairItem[]; // Item name, brand, and optional cost for tracking
  notes: string;
  reportedBy: string;
  assignedTo?: string;
  images: string[] | RepairImage[]; // Support both old format (string[]) and new format (RepairImage[])
  lastEditedAt?: string; // ISO date when repair was last updated
  hoursSpent?: number; // Duration in hours (e.g. 1.5) for internal rate and external estimate
  /** When set, this order groups multiple trades in one room; legacy rows use root fields only */
  workItems?: RepairWorkItem[];
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

export interface PreventiveRoomProgressEntry {
  roomNumber: string;
  doneAt: string;
}

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
  /** Hotel-wide tasks: rooms marked done in the current cycle */
  roomProgress?: PreventiveRoomProgressEntry[];
  /** Free-form notes e.g. comma-separated room numbers */
  roomsDoneNotes?: string;
}
