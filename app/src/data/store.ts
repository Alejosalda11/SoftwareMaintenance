// Hotel Maintenance Pro - Data Store (LocalStorage or Supabase)

import type { Damage, Room, Hotel, User, MaintenanceStats, CategoryStats, MonthlyStats, PreventiveMaintenance } from '@/types';
import { hashPassword, signUpNewUser, signOutSupabase } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import * as api from '@/data/supabase-api';

// ---------- Supabase in-memory cache and notify ----------
const CURRENT_HOTEL_KEY = 'hotel_maintenance_current_hotel_id';
let hotelsCache: Hotel[] = [];
let usersCache: User[] = [];
let damagesCache: Record<string, Damage[]> = {};
let roomsCache: Record<string, Room[]> = {};
let preventiveCache: Record<string, PreventiveMaintenance[]> = {};
let currentUserCache: User | null = null;
let currentHotelCache: Hotel | null = null;
const listeners: Array<() => void> = [];
function notify() {
  listeners.forEach((cb) => cb());
}
export function subscribe(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

// Default users with roles (first user has default password for initial login; change in Admin)
const defaultUsers: User[] = [
  {
    id: 'user1',
    name: 'Alejandro Saldarriaga',
    role: 'superadmin',
    phone: '555-0101',
    email: 'alejandro@hotel.com',
    color: '#dc2626',
    avatar: 'AS',
    canDelete: true,
    password: hashPassword('admin123')
  },
  {
    id: 'user2',
    name: 'Steven Ramirez',
    role: 'admin',
    phone: '555-0102',
    email: 'steven@hotel.com',
    color: '#3b82f6',
    avatar: 'SR',
    canDelete: false
  },
  {
    id: 'user3',
    name: 'Camilo Velasquez',
    role: 'admin',
    phone: '555-0103',
    email: 'camilo@hotel.com',
    color: '#10b981',
    avatar: 'CV',
    canDelete: false
  },
  {
    id: 'user4',
    name: 'Juan Saldarriaga',
    role: 'admin',
    phone: '555-0104',
    email: 'juan@hotel.com',
    color: '#f59e0b',
    avatar: 'JS',
    canDelete: false
  }
];

// Default hotels
const defaultHotels: Hotel[] = [
  {
    id: 'skye',
    name: 'Skye',
    address: '123 Skyline Drive',
    totalRooms: 120,
    color: '#3b82f6',
    image: ''
  },
  {
    id: 'one-global',
    name: 'One Global',
    address: '456 Global Avenue',
    totalRooms: 200,
    color: '#10b981',
    image: ''
  },
  {
    id: 'clarence',
    name: 'The Clarence Hotel',
    address: '789 Clarence Street',
    totalRooms: 85,
    color: '#8b5cf6',
    image: ''
  },
  {
    id: 'woolstore',
    name: 'Hotel Woolstore 1888',
    address: '321 Woolstore Road',
    totalRooms: 150,
    color: '#f59e0b',
    image: ''
  }
];

// Helper to generate dates
const getDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Comprehensive seed data for all hotels
const sampleDamages: Damage[] = [
  // ==================== SKYE HOTEL (20 repairs) ====================
  {
    id: 's1',
    hotelId: 'skye',
    roomNumber: '101',
    category: 'plumbing',
    description: 'Leaking faucet in bathroom sink',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(45),
    completedDate: getDate(44),
    cost: 45.50,
    materials: ['Faucet washer', 'Plumber tape', 'Silicone sealant'],
    notes: 'Replaced washer and sealed connections',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 's2',
    hotelId: 'skye',
    roomNumber: '205',
    category: 'electrical',
    description: 'Light fixture not working in bedroom',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(38),
    completedDate: getDate(38),
    cost: 25.00,
    materials: ['LED bulb', 'Wire connectors'],
    notes: 'Replaced faulty bulb',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 's3',
    hotelId: 'skye',
    roomNumber: '310',
    category: 'furniture',
    description: 'Broken chair leg in dining area',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(30),
    completedDate: getDate(28),
    cost: 80.00,
    materials: ['Wood glue', 'Screws', 'Wood filler'],
    notes: 'Repaired and reinforced chair leg',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 's4',
    hotelId: 'skye',
    roomNumber: '115',
    category: 'appliances',
    description: 'AC unit not cooling properly',
    status: 'completed',
    priority: 'high',
    reportedDate: getDate(25),
    completedDate: getDate(23),
    cost: 350.00,
    materials: ['Refrigerant', 'Filter', 'Capacitor'],
    notes: 'Recharged refrigerant and replaced filter',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 's5',
    hotelId: 'skye',
    roomNumber: '402',
    category: 'plumbing',
    description: 'Clogged shower drain',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(20),
    completedDate: getDate(20),
    cost: 65.00,
    materials: ['Drain cleaner', 'Plunger', 'Drain snake'],
    notes: 'Cleared blockage with snake',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 's6',
    hotelId: 'skye',
    roomNumber: '508',
    category: 'electrical',
    description: 'Power outlet sparking near desk',
    status: 'completed',
    priority: 'urgent',
    reportedDate: getDate(18),
    completedDate: getDate(18),
    cost: 85.00,
    materials: ['Outlet receptacle', 'Wire nuts', 'Electrical tape'],
    notes: 'Replaced faulty outlet immediately',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 's7',
    hotelId: 'skye',
    roomNumber: '612',
    category: 'hvac',
    description: 'Thermostat not responding',
    status: 'in-progress',
    priority: 'high',
    reportedDate: getDate(10),
    cost: 180.00,
    materials: ['Smart thermostat', 'Wiring kit'],
    notes: 'Ordered replacement part, installing tomorrow',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 's8',
    hotelId: 'skye',
    roomNumber: '220',
    category: 'painting',
    description: 'Wall stain needs repainting',
    status: 'pending',
    priority: 'low',
    reportedDate: getDate(5),
    cost: 0,
    materials: [],
    notes: 'Match paint color from storage',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: '',
    images: []
  },
  {
    id: 's9',
    hotelId: 'skye',
    roomNumber: '305',
    category: 'furniture',
    description: 'Bed frame squeaking',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(40),
    completedDate: getDate(39),
    cost: 35.00,
    materials: ['WD-40', 'Screws', 'Rubber pads'],
    notes: 'Tightened bolts and lubricated joints',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 's10',
    hotelId: 'skye',
    roomNumber: '118',
    category: 'appliances',
    description: 'Mini fridge not cooling',
    status: 'completed',
    priority: 'high',
    reportedDate: getDate(35),
    completedDate: getDate(33),
    cost: 220.00,
    materials: ['Compressor relay', 'Thermostat'],
    notes: 'Replaced compressor relay',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 's11',
    hotelId: 'skye',
    roomNumber: '501',
    category: 'plumbing',
    description: 'Toilet running continuously',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(28),
    completedDate: getDate(27),
    cost: 45.00,
    materials: ['Flapper valve', 'Fill valve', 'Tank bolts'],
    notes: 'Replaced flapper and adjusted fill valve',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 's12',
    hotelId: 'skye',
    roomNumber: '612',
    category: 'electrical',
    description: 'Bathroom exhaust fan noisy',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(22),
    completedDate: getDate(21),
    cost: 95.00,
    materials: ['Exhaust fan motor', 'Mounting bracket'],
    notes: 'Replaced fan motor',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 's13',
    hotelId: 'skye',
    roomNumber: '105',
    category: 'hvac',
    description: 'Heater making loud noise',
    status: 'in-progress',
    priority: 'high',
    reportedDate: getDate(8),
    cost: 280.00,
    materials: ['Blower motor belt', 'Bearings'],
    notes: 'Ordered replacement parts',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 's14',
    hotelId: 'skye',
    roomNumber: '320',
    category: 'cleaning',
    description: 'Carpet deep cleaning needed',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(15),
    completedDate: getDate(14),
    cost: 120.00,
    materials: ['Carpet cleaner', 'Stain remover', 'Deodorizer'],
    notes: 'Deep cleaned and treated stains',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 's15',
    hotelId: 'skye',
    roomNumber: '415',
    category: 'structural',
    description: 'Door hinge loose',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(32),
    completedDate: getDate(32),
    cost: 25.00,
    materials: ['Hinge screws', 'Wood filler'],
    notes: 'Tightened and reinforced hinge',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 's16',
    hotelId: 'skye',
    roomNumber: '520',
    category: 'painting',
    description: 'Touch up paint in hallway',
    status: 'pending',
    priority: 'low',
    reportedDate: getDate(3),
    cost: 0,
    materials: [],
    notes: 'Schedule during low occupancy',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: '',
    images: []
  },
  {
    id: 's17',
    hotelId: 'skye',
    roomNumber: '108',
    category: 'appliances',
    description: 'Coffee maker not heating',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(26),
    completedDate: getDate(25),
    cost: 75.00,
    materials: ['Heating element', 'Thermal fuse'],
    notes: 'Replaced heating element',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 's18',
    hotelId: 'skye',
    roomNumber: '225',
    category: 'plumbing',
    description: 'Sink drain slow',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(19),
    completedDate: getDate(19),
    cost: 55.00,
    materials: ['Drain cleaner', 'P-trap'],
    notes: 'Cleaned and replaced P-trap',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 's19',
    hotelId: 'skye',
    roomNumber: '333',
    category: 'electrical',
    description: 'TV remote not working',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(12),
    completedDate: getDate(11),
    cost: 15.00,
    materials: ['Batteries', 'Universal remote'],
    notes: 'Replaced batteries and programmed remote',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 's20',
    hotelId: 'skye',
    roomNumber: '444',
    category: 'furniture',
    description: 'Desk drawer stuck',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(17),
    completedDate: getDate(17),
    cost: 20.00,
    materials: ['Drawer slides', 'Lubricant'],
    notes: 'Replaced drawer slides',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },

  // ==================== ONE GLOBAL (18 repairs) ====================
  {
    id: 'o1',
    hotelId: 'one-global',
    roomNumber: '1001',
    category: 'plumbing',
    description: 'Leaking pipe under kitchen sink',
    status: 'completed',
    priority: 'high',
    reportedDate: getDate(42),
    completedDate: getDate(41),
    cost: 125.00,
    materials: ['PVC pipe', 'Fittings', 'Sealant'],
    notes: 'Replaced leaking section',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'o2',
    hotelId: 'one-global',
    roomNumber: '1105',
    category: 'electrical',
    description: 'Circuit breaker tripping',
    status: 'completed',
    priority: 'urgent',
    reportedDate: getDate(36),
    completedDate: getDate(36),
    cost: 200.00,
    materials: ['Circuit breaker', 'Wire', 'Connectors'],
    notes: 'Replaced faulty breaker',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 'o3',
    hotelId: 'one-global',
    roomNumber: '1208',
    category: 'hvac',
    description: 'Air conditioning not working',
    status: 'completed',
    priority: 'high',
    reportedDate: getDate(29),
    completedDate: getDate(27),
    cost: 450.00,
    materials: ['Compressor', 'Capacitor', 'Freon'],
    notes: 'Replaced compressor unit',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'o4',
    hotelId: 'one-global',
    roomNumber: '1302',
    category: 'appliances',
    description: 'Dishwasher not draining',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(24),
    completedDate: getDate(23),
    cost: 150.00,
    materials: ['Drain pump', 'Hose', 'Filter'],
    notes: 'Replaced drain pump',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'o5',
    hotelId: 'one-global',
    roomNumber: '1405',
    category: 'furniture',
    description: 'Sofa spring broken',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(20),
    completedDate: getDate(19),
    cost: 180.00,
    materials: ['Springs', 'Fabric', 'Foam'],
    notes: 'Replaced springs and repaired fabric',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'o6',
    hotelId: 'one-global',
    roomNumber: '1501',
    category: 'painting',
    description: 'Lobby wall repaint',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(14),
    completedDate: getDate(12),
    cost: 800.00,
    materials: ['Paint', 'Primer', 'Brushes', 'Rollers'],
    notes: 'Repainted entire lobby area',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'o7',
    hotelId: 'one-global',
    roomNumber: '1603',
    category: 'cleaning',
    description: 'Deep clean after guest checkout',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(8),
    completedDate: getDate(8),
    cost: 95.00,
    materials: ['Cleaning supplies', 'Carpet shampoo'],
    notes: 'Deep cleaned entire suite',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'o8',
    hotelId: 'one-global',
    roomNumber: '1707',
    category: 'structural',
    description: 'Window seal damaged',
    status: 'in-progress',
    priority: 'high',
    reportedDate: getDate(6),
    cost: 350.00,
    materials: ['Weather stripping', 'Caulk', 'Sealant'],
    notes: 'Waiting for weather stripping delivery',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 'o9',
    hotelId: 'one-global',
    roomNumber: '1802',
    category: 'plumbing',
    description: 'Hot water not working',
    status: 'completed',
    priority: 'urgent',
    reportedDate: getDate(16),
    completedDate: getDate(16),
    cost: 280.00,
    materials: ['Water heater element', 'Thermostat'],
    notes: 'Replaced heating element',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'o10',
    hotelId: 'one-global',
    roomNumber: '1904',
    category: 'electrical',
    description: 'Dimmer switch not working',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(11),
    completedDate: getDate(10),
    cost: 65.00,
    materials: ['Dimmer switch', 'Wire nuts'],
    notes: 'Replaced dimmer switch',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'o11',
    hotelId: 'one-global',
    roomNumber: '2001',
    category: 'appliances',
    description: 'Microwave not heating',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(21),
    completedDate: getDate(20),
    cost: 120.00,
    materials: ['Magnetron', 'Capacitor'],
    notes: 'Replaced magnetron',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'o12',
    hotelId: 'one-global',
    roomNumber: '1010',
    category: 'hvac',
    description: 'Ventilation fan noisy',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(13),
    completedDate: getDate(12),
    cost: 140.00,
    materials: ['Fan motor', 'Blades'],
    notes: 'Replaced fan motor',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 'o13',
    hotelId: 'one-global',
    roomNumber: '1111',
    category: 'furniture',
    description: 'Closet door off track',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(18),
    completedDate: getDate(18),
    cost: 45.00,
    materials: ['Track rollers', 'Guide'],
    notes: 'Replaced rollers and realigned track',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'o14',
    hotelId: 'one-global',
    roomNumber: '1212',
    category: 'plumbing',
    description: 'Bathtub drain clogged',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(9),
    completedDate: getDate(9),
    cost: 85.00,
    materials: ['Drain snake', 'Cleaner'],
    notes: 'Cleared blockage',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'o15',
    hotelId: 'one-global',
    roomNumber: '1313',
    category: 'electrical',
    description: 'Smoke detector chirping',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(7),
    completedDate: getDate(7),
    cost: 35.00,
    materials: ['9V batteries', 'Smoke detector'],
    notes: 'Replaced batteries and tested',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'o16',
    hotelId: 'one-global',
    roomNumber: '1414',
    category: 'cleaning',
    description: 'Tile grout cleaning',
    status: 'pending',
    priority: 'low',
    reportedDate: getDate(4),
    cost: 0,
    materials: [],
    notes: 'Schedule during maintenance window',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: '',
    images: []
  },
  {
    id: 'o17',
    hotelId: 'one-global',
    roomNumber: '1515',
    category: 'appliances',
    description: 'Ice maker not working',
    status: 'in-progress',
    priority: 'medium',
    reportedDate: getDate(2),
    cost: 200.00,
    materials: ['Water valve', 'Filter'],
    notes: 'Diagnosing issue',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'o18',
    hotelId: 'one-global',
    roomNumber: '1616',
    category: 'painting',
    description: 'Ceiling touch up',
    status: 'pending',
    priority: 'low',
    reportedDate: getDate(1),
    cost: 0,
    materials: [],
    notes: 'Water stain from above unit',
    reportedBy: 'Steven Ramirez',
    assignedTo: '',
    images: []
  },

  // ==================== THE CLARENCE HOTEL (16 repairs) ====================
  {
    id: 'c1',
    hotelId: 'clarence',
    roomNumber: '10',
    category: 'plumbing',
    description: 'Faucet dripping',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(44),
    completedDate: getDate(43),
    cost: 35.00,
    materials: ['Cartridge', 'O-rings'],
    notes: 'Replaced faucet cartridge',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'c2',
    hotelId: 'clarence',
    roomNumber: '15',
    category: 'electrical',
    description: 'Reading lamp flickering',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(37),
    completedDate: getDate(37),
    cost: 25.00,
    materials: ['LED bulb', 'Switch'],
    notes: 'Replaced bulb and switch',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'c3',
    hotelId: 'clarence',
    roomNumber: '22',
    category: 'furniture',
    description: 'Wardrobe door hinge broken',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(31),
    completedDate: getDate(30),
    cost: 55.00,
    materials: ['Hinges', 'Screws'],
    notes: 'Replaced hinges',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 'c4',
    hotelId: 'clarence',
    roomNumber: '8',
    category: 'appliances',
    description: 'Safe not opening',
    status: 'completed',
    priority: 'high',
    reportedDate: getDate(26),
    completedDate: getDate(25),
    cost: 180.00,
    materials: ['Safe battery', 'Keypad'],
    notes: 'Replaced battery and reset code',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'c5',
    hotelId: 'clarence',
    roomNumber: '30',
    category: 'hvac',
    description: 'Radiator not heating',
    status: 'completed',
    priority: 'high',
    reportedDate: getDate(19),
    completedDate: getDate(18),
    cost: 220.00,
    materials: ['Valve', 'Thermostatic head'],
    notes: 'Replaced valve and bled radiator',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'c6',
    hotelId: 'clarence',
    roomNumber: '5',
    category: 'painting',
    description: 'Scuff marks on wall',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(15),
    completedDate: getDate(14),
    cost: 45.00,
    materials: ['Touch-up paint', 'Brush'],
    notes: 'Touched up paint',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'c7',
    hotelId: 'clarence',
    roomNumber: '18',
    category: 'cleaning',
    description: 'Curtain cleaning',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(10),
    completedDate: getDate(9),
    cost: 75.00,
    materials: ['Dry cleaning service'],
    notes: 'Professional curtain cleaning',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 'c8',
    hotelId: 'clarence',
    roomNumber: '12',
    category: 'structural',
    description: 'Floorboard loose',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(6),
    completedDate: getDate(6),
    cost: 65.00,
    materials: ['Nails', 'Wood glue'],
    notes: 'Secured floorboard',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'c9',
    hotelId: 'clarence',
    roomNumber: '25',
    category: 'plumbing',
    description: 'Shower head leaking',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(23),
    completedDate: getDate(22),
    cost: 40.00,
    materials: ['Shower head', 'Teflon tape'],
    notes: 'Replaced shower head',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'c10',
    hotelId: 'clarence',
    roomNumber: '35',
    category: 'electrical',
    description: 'USB ports not charging',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(17),
    completedDate: getDate(16),
    cost: 85.00,
    materials: ['USB outlet', 'Faceplate'],
    notes: 'Replaced USB outlet',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'c11',
    hotelId: 'clarence',
    roomNumber: '40',
    category: 'furniture',
    description: 'Headboard loose',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(12),
    completedDate: getDate(11),
    cost: 30.00,
    materials: ['Wall anchors', 'Screws'],
    notes: 'Re-secured headboard',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 'c12',
    hotelId: 'clarence',
    roomNumber: '3',
    category: 'appliances',
    description: 'Iron not heating',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(8),
    completedDate: getDate(7),
    cost: 55.00,
    materials: ['Replacement iron'],
    notes: 'Replaced faulty iron',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'c13',
    hotelId: 'clarence',
    roomNumber: '45',
    category: 'hvac',
    description: 'Room too cold',
    status: 'in-progress',
    priority: 'high',
    reportedDate: getDate(5),
    cost: 150.00,
    materials: ['Thermostat', 'Sensor'],
    notes: 'Checking HVAC system',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'c14',
    hotelId: 'clarence',
    roomNumber: '50',
    category: 'painting',
    description: 'Bathroom repaint needed',
    status: 'pending',
    priority: 'medium',
    reportedDate: getDate(3),
    cost: 0,
    materials: [],
    notes: 'Schedule during renovation',
    reportedBy: 'Steven Ramirez',
    assignedTo: '',
    images: []
  },
  {
    id: 'c15',
    hotelId: 'clarence',
    roomNumber: '7',
    category: 'plumbing',
    description: 'Sink stopper stuck',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(14),
    completedDate: getDate(13),
    cost: 25.00,
    materials: ['Stopper assembly'],
    notes: 'Replaced stopper mechanism',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'c16',
    hotelId: 'clarence',
    roomNumber: '28',
    category: 'electrical',
    description: 'Hair dryer not working',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(4),
    completedDate: getDate(4),
    cost: 40.00,
    materials: ['Hair dryer'],
    notes: 'Replaced with new unit',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },

  // ==================== HOTEL WOOLSTORE 1888 (18 repairs) ====================
  {
    id: 'w1',
    hotelId: 'woolstore',
    roomNumber: '101',
    category: 'plumbing',
    description: 'Toilet not flushing properly',
    status: 'completed',
    priority: 'high',
    reportedDate: getDate(43),
    completedDate: getDate(42),
    cost: 95.00,
    materials: ['Flush valve', 'Fill valve', 'Flapper'],
    notes: 'Replaced entire flush mechanism',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'w2',
    hotelId: 'woolstore',
    roomNumber: '205',
    category: 'electrical',
    description: ' bedside lamp not working',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(39),
    completedDate: getDate(38),
    cost: 30.00,
    materials: ['Lamp socket', 'Bulb'],
    notes: 'Replaced socket',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'w3',
    hotelId: 'woolstore',
    roomNumber: '310',
    category: 'furniture',
    description: 'Dresser drawer handle broken',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(34),
    completedDate: getDate(33),
    cost: 20.00,
    materials: ['Drawer pulls', 'Screws'],
    notes: 'Replaced handles',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'w4',
    hotelId: 'woolstore',
    roomNumber: '115',
    category: 'appliances',
    description: 'Television no signal',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(27),
    completedDate: getDate(26),
    cost: 120.00,
    materials: ['HDMI cable', 'Remote'],
    notes: 'Replaced cables and reprogrammed remote',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 'w5',
    hotelId: 'woolstore',
    roomNumber: '420',
    category: 'hvac',
    description: 'Air conditioner leaking water',
    status: 'completed',
    priority: 'high',
    reportedDate: getDate(21),
    completedDate: getDate(20),
    cost: 280.00,
    materials: ['Drain pan', 'Condensate pump'],
    notes: 'Replaced drain pan and pump',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'w6',
    hotelId: 'woolstore',
    roomNumber: '505',
    category: 'painting',
    description: 'Window frame touch up',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(16),
    completedDate: getDate(15),
    cost: 55.00,
    materials: ['Paint', 'Brush', 'Caulk'],
    notes: 'Touched up window frames',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'w7',
    hotelId: 'woolstore',
    roomNumber: '220',
    category: 'cleaning',
    description: 'Upholstery cleaning',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(11),
    completedDate: getDate(10),
    cost: 150.00,
    materials: ['Steam cleaner', 'Upholstery shampoo'],
    notes: 'Deep cleaned all upholstery',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'w8',
    hotelId: 'woolstore',
    roomNumber: '333',
    category: 'structural',
    description: 'Balcony door stuck',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(7),
    completedDate: getDate(6),
    cost: 85.00,
    materials: ['Track lubricant', 'Rollers'],
    notes: 'Cleaned and lubricated track',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 'w9',
    hotelId: 'woolstore',
    roomNumber: '125',
    category: 'plumbing',
    description: 'Kitchen sink leaking',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(24),
    completedDate: getDate(23),
    cost: 75.00,
    materials: ['P-trap', 'Washers', 'Sealant'],
    notes: 'Replaced P-trap',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'w10',
    hotelId: 'woolstore',
    roomNumber: '240',
    category: 'electrical',
    description: 'Ceiling fan wobbling',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(19),
    completedDate: getDate(18),
    cost: 65.00,
    materials: ['Fan blade balancing kit'],
    notes: 'Balanced fan blades',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'w11',
    hotelId: 'woolstore',
    roomNumber: '355',
    category: 'appliances',
    description: 'Refrigerator making noise',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(13),
    completedDate: getDate(12),
    cost: 200.00,
    materials: ['Evaporator fan motor'],
    notes: 'Replaced fan motor',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'w12',
    hotelId: 'woolstore',
    roomNumber: '410',
    category: 'furniture',
    description: 'Office chair broken',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(9),
    completedDate: getDate(8),
    cost: 110.00,
    materials: ['Office chair base', 'Casters'],
    notes: 'Replaced chair base',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: 'Alejandro Saldarriaga',
    images: []
  },
  {
    id: 'w13',
    hotelId: 'woolstore',
    roomNumber: '130',
    category: 'hvac',
    description: 'Vent blowing dust',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(5),
    completedDate: getDate(4),
    cost: 95.00,
    materials: ['Air filter', 'Duct cleaner'],
    notes: 'Cleaned ducts and replaced filter',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'w14',
    hotelId: 'woolstore',
    roomNumber: '245',
    category: 'plumbing',
    description: 'Water pressure low',
    status: 'in-progress',
    priority: 'high',
    reportedDate: getDate(3),
    cost: 180.00,
    materials: ['Pressure regulator', 'Aerators'],
    notes: 'Diagnosing pressure issue',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Camilo Velasquez',
    images: []
  },
  {
    id: 'w15',
    hotelId: 'woolstore',
    roomNumber: '360',
    category: 'electrical',
    description: 'Key card reader not working',
    status: 'completed',
    priority: 'urgent',
    reportedDate: getDate(2),
    completedDate: getDate(2),
    cost: 250.00,
    materials: ['Card reader', 'Wiring'],
    notes: 'Replaced card reader urgently',
    reportedBy: 'Camilo Velasquez',
    assignedTo: 'Juan Saldarriaga',
    images: []
  },
  {
    id: 'w16',
    hotelId: 'woolstore',
    roomNumber: '415',
    category: 'painting',
    description: 'Accent wall repaint',
    status: 'pending',
    priority: 'low',
    reportedDate: getDate(1),
    cost: 0,
    materials: [],
    notes: 'Guest request for color change',
    reportedBy: 'Juan Saldarriaga',
    assignedTo: '',
    images: []
  },
  {
    id: 'w17',
    hotelId: 'woolstore',
    roomNumber: '135',
    category: 'cleaning',
    description: 'Mattress stain removal',
    status: 'completed',
    priority: 'medium',
    reportedDate: getDate(6),
    completedDate: getDate(5),
    cost: 85.00,
    materials: ['Stain remover', 'Steam cleaner'],
    notes: 'Successfully removed stain',
    reportedBy: 'Alejandro Saldarriaga',
    assignedTo: 'Steven Ramirez',
    images: []
  },
  {
    id: 'w18',
    hotelId: 'woolstore',
    roomNumber: '250',
    category: 'appliances',
    description: 'Blender not working',
    status: 'completed',
    priority: 'low',
    reportedDate: getDate(8),
    completedDate: getDate(7),
    cost: 45.00,
    materials: ['Replacement blender'],
    notes: 'Replaced kitchen blender',
    reportedBy: 'Steven Ramirez',
    assignedTo: 'Camilo Velasquez',
    images: []
  }
];

// Sample rooms for each hotel
const sampleRooms: Room[] = [
  // Skye
  { hotelId: 'skye', number: '101', floor: 1, type: 'Standard', status: 'available' },
  { hotelId: 'skye', number: '102', floor: 1, type: 'Standard', status: 'occupied' },
  { hotelId: 'skye', number: '105', floor: 1, type: 'Deluxe', status: 'available' },
  { hotelId: 'skye', number: '108', floor: 1, type: 'Standard', status: 'maintenance' },
  { hotelId: 'skye', number: '115', floor: 1, type: 'Suite', status: 'maintenance' },
  { hotelId: 'skye', number: '118', floor: 1, type: 'Standard', status: 'available' },
  { hotelId: 'skye', number: '205', floor: 2, type: 'Standard', status: 'occupied' },
  { hotelId: 'skye', number: '220', floor: 2, type: 'Deluxe', status: 'available' },
  { hotelId: 'skye', number: '225', floor: 2, type: 'Standard', status: 'maintenance' },
  { hotelId: 'skye', number: '305', floor: 3, type: 'Suite', status: 'occupied' },
  { hotelId: 'skye', number: '310', floor: 3, type: 'Suite', status: 'maintenance' },
  { hotelId: 'skye', number: '320', floor: 3, type: 'Deluxe', status: 'available' },
  { hotelId: 'skye', number: '333', floor: 3, type: 'Standard', status: 'available' },
  { hotelId: 'skye', number: '402', floor: 4, type: 'Deluxe', status: 'occupied' },
  { hotelId: 'skye', number: '415', floor: 4, type: 'Standard', status: 'available' },
  { hotelId: 'skye', number: '420', floor: 4, type: 'Suite', status: 'maintenance' },
  { hotelId: 'skye', number: '444', floor: 4, type: 'Standard', status: 'available' },
  { hotelId: 'skye', number: '501', floor: 5, type: 'Standard', status: 'occupied' },
  { hotelId: 'skye', number: '508', floor: 5, type: 'Deluxe', status: 'maintenance' },
  { hotelId: 'skye', number: '520', floor: 5, type: 'Suite', status: 'available' },
  { hotelId: 'skye', number: '612', floor: 6, type: 'Suite', status: 'maintenance' },
  
  // One Global
  { hotelId: 'one-global', number: '1001', floor: 10, type: 'Standard', status: 'occupied' },
  { hotelId: 'one-global', number: '1010', floor: 10, type: 'Deluxe', status: 'available' },
  { hotelId: 'one-global', number: '1105', floor: 11, type: 'Suite', status: 'maintenance' },
  { hotelId: 'one-global', number: '1111', floor: 11, type: 'Standard', status: 'available' },
  { hotelId: 'one-global', number: '1208', floor: 12, type: 'Deluxe', status: 'maintenance' },
  { hotelId: 'one-global', number: '1212', floor: 12, type: 'Standard', status: 'occupied' },
  { hotelId: 'one-global', number: '1302', floor: 13, type: 'Suite', status: 'available' },
  { hotelId: 'one-global', number: '1313', floor: 13, type: 'Standard', status: 'maintenance' },
  { hotelId: 'one-global', number: '1405', floor: 14, type: 'Deluxe', status: 'occupied' },
  { hotelId: 'one-global', number: '1414', floor: 14, type: 'Standard', status: 'available' },
  { hotelId: 'one-global', number: '1501', floor: 15, type: 'Suite', status: 'maintenance' },
  { hotelId: 'one-global', number: '1515', floor: 15, type: 'Standard', status: 'available' },
  { hotelId: 'one-global', number: '1603', floor: 16, type: 'Deluxe', status: 'occupied' },
  { hotelId: 'one-global', number: '1616', floor: 16, type: 'Standard', status: 'maintenance' },
  { hotelId: 'one-global', number: '1707', floor: 17, type: 'Suite', status: 'maintenance' },
  { hotelId: 'one-global', number: '1802', floor: 18, type: 'Standard', status: 'occupied' },
  { hotelId: 'one-global', number: '1904', floor: 19, type: 'Deluxe', status: 'available' },
  { hotelId: 'one-global', number: '2001', floor: 20, type: 'Suite', status: 'available' },
  
  // Clarence
  { hotelId: 'clarence', number: '3', floor: 1, type: 'Standard', status: 'available' },
  { hotelId: 'clarence', number: '5', floor: 1, type: 'Deluxe', status: 'available' },
  { hotelId: 'clarence', number: '7', floor: 1, type: 'Standard', status: 'occupied' },
  { hotelId: 'clarence', number: '8', floor: 1, type: 'Suite', status: 'maintenance' },
  { hotelId: 'clarence', number: '10', floor: 1, type: 'Standard', status: 'available' },
  { hotelId: 'clarence', number: '12', floor: 1, type: 'Deluxe', status: 'maintenance' },
  { hotelId: 'clarence', number: '15', floor: 1, type: 'Standard', status: 'occupied' },
  { hotelId: 'clarence', number: '18', floor: 1, type: 'Suite', status: 'available' },
  { hotelId: 'clarence', number: '22', floor: 2, type: 'Deluxe', status: 'occupied' },
  { hotelId: 'clarence', number: '25', floor: 2, type: 'Standard', status: 'available' },
  { hotelId: 'clarence', number: '28', floor: 2, type: 'Suite', status: 'occupied' },
  { hotelId: 'clarence', number: '30', floor: 2, type: 'Deluxe', status: 'maintenance' },
  { hotelId: 'clarence', number: '35', floor: 2, type: 'Standard', status: 'available' },
  { hotelId: 'clarence', number: '40', floor: 2, type: 'Suite', status: 'occupied' },
  { hotelId: 'clarence', number: '45', floor: 2, type: 'Deluxe', status: 'maintenance' },
  { hotelId: 'clarence', number: '50', floor: 2, type: 'Standard', status: 'available' },
  
  // Woolstore
  { hotelId: 'woolstore', number: '101', floor: 1, type: 'Standard', status: 'occupied' },
  { hotelId: 'woolstore', number: '115', floor: 1, type: 'Deluxe', status: 'available' },
  { hotelId: 'woolstore', number: '125', floor: 1, type: 'Standard', status: 'maintenance' },
  { hotelId: 'woolstore', number: '130', floor: 1, type: 'Suite', status: 'available' },
  { hotelId: 'woolstore', number: '135', floor: 1, type: 'Standard', status: 'occupied' },
  { hotelId: 'woolstore', number: '205', floor: 2, type: 'Deluxe', status: 'occupied' },
  { hotelId: 'woolstore', number: '220', floor: 2, type: 'Suite', status: 'available' },
  { hotelId: 'woolstore', number: '240', floor: 2, type: 'Standard', status: 'maintenance' },
  { hotelId: 'woolstore', number: '245', floor: 2, type: 'Deluxe', status: 'maintenance' },
  { hotelId: 'woolstore', number: '250', floor: 2, type: 'Standard', status: 'available' },
  { hotelId: 'woolstore', number: '310', floor: 3, type: 'Suite', status: 'occupied' },
  { hotelId: 'woolstore', number: '333', floor: 3, type: 'Deluxe', status: 'available' },
  { hotelId: 'woolstore', number: '355', floor: 3, type: 'Standard', status: 'maintenance' },
  { hotelId: 'woolstore', number: '360', floor: 3, type: 'Suite', status: 'occupied' },
  { hotelId: 'woolstore', number: '415', floor: 4, type: 'Deluxe', status: 'available' },
  { hotelId: 'woolstore', number: '420', floor: 4, type: 'Standard', status: 'occupied' },
  { hotelId: 'woolstore', number: '505', floor: 5, type: 'Suite', status: 'maintenance' },
];

// Storage keys
const STORAGE_KEYS = {
  damages: 'hotel_maintenance_damages',
  rooms: 'hotel_maintenance_rooms',
  users: 'hotel_maintenance_users',
  hotels: 'hotel_maintenance_hotels',
  currentUser: 'hotel_maintenance_current_user',
  currentHotel: 'hotel_maintenance_current_hotel',
  preventive: 'hotel_maintenance_preventive'
};

// Initialize data (async when Supabase is used)
export async function initializeData(): Promise<void> {
  if (supabase) {
    try {
      const [hotels, profiles] = await Promise.all([api.fetchHotels(), api.fetchProfiles()]);
      hotelsCache = hotels;
      usersCache = profiles;
      const hotelId = sessionStorage.getItem(CURRENT_HOTEL_KEY);
      if (hotelId) {
        const hotel = await api.fetchHotelById(hotelId);
        if (hotel) {
          currentHotelCache = hotel;
          const [damages, rooms, preventive] = await Promise.all([
            api.fetchDamages(hotelId),
            api.fetchRooms(hotelId),
            api.fetchPreventive(hotelId),
          ]);
          damagesCache[hotelId] = damages;
          roomsCache[hotelId] = rooms;
          preventiveCache[hotelId] = preventive;
        }
      }
      notify();
    } catch (e) {
      console.error('Supabase init error:', e);
    }
    return;
  }
  if (!localStorage.getItem(STORAGE_KEYS.damages)) {
    localStorage.setItem(STORAGE_KEYS.damages, JSON.stringify(sampleDamages));
  }
  if (!localStorage.getItem(STORAGE_KEYS.rooms)) {
    localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(sampleRooms));
  }
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.hotels)) {
    localStorage.setItem(STORAGE_KEYS.hotels, JSON.stringify(defaultHotels));
  }
  if (!localStorage.getItem(STORAGE_KEYS.preventive)) {
    localStorage.setItem(STORAGE_KEYS.preventive, JSON.stringify([]));
  }
}

// ==================== USER MANAGEMENT ====================

export const getUsers = (): User[] => {
  if (supabase) return usersCache;
  const data = localStorage.getItem(STORAGE_KEYS.users);
  return data ? JSON.parse(data) : defaultUsers;
};

export const getUserById = (id: string): User | undefined => {
  const users = getUsers();
  return users.find(u => u.id === id);
};

export const addUser = (user: Omit<User, 'id'>): User => {
  if (supabase) {
    const email = user.email || `${user.name.replace(/\s/g, '').toLowerCase()}@hotel.local`;
    const password = (user as User & { password?: string }).password || 'changeme123';
    signUpNewUser(email, password, {
      name: user.name,
      role: user.role,
      phone: user.phone,
      color: user.color,
      avatar: user.avatar,
      can_delete: user.canDelete,
    }).then((uid) => {
      if (uid) {
        api.updateProfileRow(uid, user).then(() => {
          api.fetchProfiles().then((profiles) => {
            usersCache = profiles;
            notify();
          });
        }).catch(() => {
          api.fetchProfiles().then((profiles) => {
            usersCache = profiles;
            notify();
          });
        });
      }
    }).catch(console.error);
    return { ...user, id: `user-temp-${Date.now()}` };
  }
  const users = getUsers();
  const newUser = { ...user, id: `user${Date.now()}` };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  return newUser;
};

export const updateUser = (id: string, updates: Partial<User>): User | null => {
  if (supabase) {
    api.updateProfileRow(id, updates).then((updated) => {
      if (updated) {
        const idx = usersCache.findIndex(u => u.id === id);
        if (idx >= 0) usersCache[idx] = updated;
        if (currentUserCache?.id === id) currentUserCache = updated;
        notify();
      }
    }).catch(console.error);
    const existing = usersCache.find(u => u.id === id);
    return existing ? { ...existing, ...updates } : null;
  }
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  return users[index];
};

export const deleteUser = (id: string, currentUser: User): boolean => {
  if (currentUser.role !== 'superadmin') return false;
  if (supabase) {
    api.deleteProfileById(id).then((ok) => {
      if (ok) {
        usersCache = usersCache.filter(u => u.id !== id);
        if (currentUserCache?.id === id) currentUserCache = null;
        notify();
      }
    }).catch(console.error);
    const had = usersCache.some(u => u.id === id);
    if (had) {
      usersCache = usersCache.filter(u => u.id !== id);
      if (currentUserCache?.id === id) currentUserCache = null;
      notify();
      return true;
    }
    return false;
  }
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(filtered));
  return true;
};

export const canDeleteUser = (currentUser: User, _targetUser?: User): boolean => {
  // Only superadmin can delete
  if (currentUser.role !== 'superadmin') return false;
  return true;
};

export const canManageUsers = (user: User): boolean => {
  return user.role === 'superadmin' || user.role === 'admin';
};

// ==================== HOTEL MANAGEMENT ====================

export const getHotels = (): Hotel[] => {
  if (supabase) return hotelsCache;
  const data = localStorage.getItem(STORAGE_KEYS.hotels);
  return data ? JSON.parse(data) : defaultHotels;
};

export const getHotelById = (id: string): Hotel | undefined => {
  const hotels = getHotels();
  return hotels.find(h => h.id === id);
};

export const addHotel = (hotel: Omit<Hotel, 'id'>): Hotel => {
  if (supabase) {
    api.insertHotel(hotel).then((inserted) => {
      if (inserted) {
        hotelsCache = [...hotelsCache, inserted];
        notify();
      }
    }).catch(console.error);
    return { ...hotel, id: `hotel-temp-${Date.now()}` };
  }
  const hotels = getHotels();
  const newHotel = { ...hotel, id: `hotel${Date.now()}` };
  hotels.push(newHotel);
  localStorage.setItem(STORAGE_KEYS.hotels, JSON.stringify(hotels));
  return newHotel;
};

export const updateHotel = (id: string, updates: Partial<Hotel>): Hotel | null => {
  if (supabase) {
    api.updateHotelRow(id, updates).then((updated) => {
      if (updated) {
        const idx = hotelsCache.findIndex(h => h.id === id);
        if (idx >= 0) hotelsCache[idx] = updated;
        if (currentHotelCache?.id === id) currentHotelCache = updated;
        notify();
      }
    }).catch(console.error);
    const existing = hotelsCache.find(h => h.id === id);
    return existing ? { ...existing, ...updates } : null;
  }
  const hotels = getHotels();
  const index = hotels.findIndex(h => h.id === id);
  if (index === -1) return null;
  hotels[index] = { ...hotels[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.hotels, JSON.stringify(hotels));
  return hotels[index];
};

export const deleteHotel = (id: string, currentUser: User): boolean => {
  if (currentUser.role !== 'superadmin' && currentUser.role !== 'admin') return false;
  if (supabase) {
    api.deleteHotelById(id).then((ok) => {
      if (ok) {
        hotelsCache = hotelsCache.filter(h => h.id !== id);
        if (currentHotelCache?.id === id) {
          currentHotelCache = null;
          sessionStorage.removeItem(CURRENT_HOTEL_KEY);
        }
        delete damagesCache[id];
        delete roomsCache[id];
        delete preventiveCache[id];
        notify();
      }
    }).catch(console.error);
    const had = hotelsCache.some(h => h.id === id);
    if (had) {
      hotelsCache = hotelsCache.filter(h => h.id !== id);
      if (currentHotelCache?.id === id) currentHotelCache = null;
      sessionStorage.removeItem(CURRENT_HOTEL_KEY);
      delete damagesCache[id];
      delete roomsCache[id];
      delete preventiveCache[id];
      notify();
      return true;
    }
    return false;
  }
  const hotels = getHotels();
  const filtered = hotels.filter(h => h.id !== id);
  if (filtered.length === hotels.length) return false;
  localStorage.setItem(STORAGE_KEYS.hotels, JSON.stringify(filtered));
  return true;
};

// ==================== SESSION MANAGEMENT ====================

export const getCurrentUser = (): User | null => {
  if (supabase) return currentUserCache;
  const data = localStorage.getItem(STORAGE_KEYS.currentUser);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (supabase) {
    currentUserCache = user;
    notify();
    return;
  }
  if (user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
};

export const getCurrentHotel = (): Hotel | null => {
  if (supabase) return currentHotelCache;
  const data = localStorage.getItem(STORAGE_KEYS.currentHotel);
  return data ? JSON.parse(data) : null;
}

export async function setCurrentHotel(hotel: Hotel | null): Promise<void> {
  if (supabase) {
    currentHotelCache = hotel;
    if (hotel) {
      sessionStorage.setItem(CURRENT_HOTEL_KEY, hotel.id);
      try {
        const [damages, rooms, preventive] = await Promise.all([
          api.fetchDamages(hotel.id),
          api.fetchRooms(hotel.id),
          api.fetchPreventive(hotel.id),
        ]);
        damagesCache[hotel.id] = damages;
        roomsCache[hotel.id] = rooms;
        preventiveCache[hotel.id] = preventive;
      } catch (e) {
        console.error('Failed to load hotel data:', e);
      }
    } else {
      sessionStorage.removeItem(CURRENT_HOTEL_KEY);
    }
    notify();
    return;
  }
  if (hotel) {
    localStorage.setItem(STORAGE_KEYS.currentHotel, JSON.stringify(hotel));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentHotel);
  }
}

// ==================== DAMAGE OPERATIONS ====================

export type DateRange = { start: string; end: string };

function filterDamagesByDateRange(damages: Damage[], dateRange?: DateRange): Damage[] {
  if (!dateRange) return damages;
  const start = new Date(dateRange.start).getTime();
  const end = new Date(dateRange.end).getTime();
  return damages.filter(d => {
    const reported = new Date(d.reportedDate).getTime();
    return reported >= start && reported <= end;
  });
}

export const getDamages = (hotelId?: string, dateRange?: DateRange): Damage[] => {
  if (supabase) {
    if (!hotelId) return [];
    const list = damagesCache[hotelId] ?? [];
    return filterDamagesByDateRange(list, dateRange);
  }
  const data = localStorage.getItem(STORAGE_KEYS.damages);
  const damages = data ? JSON.parse(data) : [];
  let result = hotelId ? damages.filter((d: Damage) => d.hotelId === hotelId) : damages;
  return filterDamagesByDateRange(result, dateRange);
};

export const addDamage = (damage: Omit<Damage, 'id'>): Damage => {
  if (supabase) {
    const hotelId = damage.hotelId;
    api.insertDamage(damage).then((inserted) => {
      if (inserted && damagesCache[hotelId]) {
        damagesCache[hotelId] = [inserted, ...damagesCache[hotelId]];
        notify();
      }
    }).catch(console.error);
    return { ...damage, id: `temp-${Date.now()}` };
  }
  const damages = getDamages();
  const newDamage = { ...damage, id: `damage${Date.now()}` };
  damages.push(newDamage);
  localStorage.setItem(STORAGE_KEYS.damages, JSON.stringify(damages));
  return newDamage;
};

export const updateDamage = (id: string, updates: Partial<Damage>): Damage | null => {
  if (supabase) {
    const hotelId = currentHotelCache?.id;
    if (hotelId && damagesCache[hotelId]) {
      api.updateDamage(id, updates).then((updated) => {
        if (updated) {
          const idx = damagesCache[hotelId].findIndex(d => d.id === id);
          if (idx >= 0) damagesCache[hotelId][idx] = updated;
          notify();
        }
      }).catch(console.error);
    }
    const list = damagesCache[currentHotelCache?.id ?? ''];
    const existing = list?.find(d => d.id === id);
    return existing ? { ...existing, ...updates } : null;
  }
  const damages = getDamages();
  const index = damages.findIndex(d => d.id === id);
  if (index === -1) return null;
  damages[index] = { ...damages[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.damages, JSON.stringify(damages));
  return damages[index];
};

export const deleteDamage = (id: string): boolean => {
  if (supabase) {
    const hotelId = currentHotelCache?.id;
    api.deleteDamageById(id).then((ok) => {
      if (ok && hotelId && damagesCache[hotelId]) {
        damagesCache[hotelId] = damagesCache[hotelId].filter(d => d.id !== id);
        notify();
      }
    }).catch(console.error);
    if (hotelId && damagesCache[hotelId]) {
      damagesCache[hotelId] = damagesCache[hotelId].filter(d => d.id !== id);
      notify();
      return true;
    }
    return false;
  }
  const damages = getDamages();
  const filtered = damages.filter(d => d.id !== id);
  if (filtered.length === damages.length) return false;
  localStorage.setItem(STORAGE_KEYS.damages, JSON.stringify(filtered));
  return true;
};

// ==================== ROOM OPERATIONS ====================

export const getRooms = (hotelId?: string): Room[] => {
  if (supabase) {
    if (!hotelId) return [];
    return roomsCache[hotelId] ?? [];
  }
  const data = localStorage.getItem(STORAGE_KEYS.rooms);
  const rooms = data ? JSON.parse(data) : [];
  if (hotelId) return rooms.filter((r: Room) => r.hotelId === hotelId);
  return rooms;
};

export const updateRoom = (hotelId: string, roomNumber: string, updates: Partial<Room>): Room | null => {
  if (supabase) {
    api.updateRoomRow(hotelId, roomNumber, updates).then((updated) => {
      if (updated && roomsCache[hotelId]) {
        const idx = roomsCache[hotelId].findIndex(r => r.number === roomNumber);
        if (idx >= 0) roomsCache[hotelId][idx] = updated;
        notify();
      }
    }).catch(console.error);
    const list = roomsCache[hotelId];
    const existing = list?.find(r => r.number === roomNumber);
    return existing ? { ...existing, ...updates } : null;
  }
  const rooms = getRooms();
  const index = rooms.findIndex(r => r.hotelId === hotelId && r.number === roomNumber);
  if (index === -1) return null;
  rooms[index] = { ...rooms[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
  return rooms[index];
};

// ==================== PREVENTIVE MAINTENANCE OPERATIONS ====================

export const getPreventiveMaintenance = (hotelId?: string, roomNumber?: string): PreventiveMaintenance[] => {
  if (supabase) {
    if (!hotelId) return [];
    let list = preventiveCache[hotelId] ?? [];
    if (roomNumber) list = list.filter((p) => p.roomNumber === roomNumber);
    const now = new Date();
    return list.map((p) => {
      const dueDate = new Date(p.nextDueDate);
      let status = p.status;
      if (status !== 'completed' && dueDate < now) status = 'overdue';
      else if (status === 'overdue' && dueDate >= now) status = 'pending';
      return { ...p, status };
    });
  }
  const data = localStorage.getItem(STORAGE_KEYS.preventive);
  const preventive = data ? JSON.parse(data) : [];
  let filtered = preventive;
  if (hotelId) filtered = filtered.filter((p: PreventiveMaintenance) => p.hotelId === hotelId);
  if (roomNumber) filtered = filtered.filter((p: PreventiveMaintenance) => p.roomNumber === roomNumber);
  const now = new Date();
  filtered = filtered.map((p: PreventiveMaintenance) => {
    const dueDate = new Date(p.nextDueDate);
    let status = p.status;
    if (status !== 'completed' && dueDate < now) status = 'overdue';
    else if (status === 'overdue' && dueDate >= now) status = 'pending';
    return { ...p, status };
  });
  if (filtered.length > 0) {
    const allPreventive = data ? JSON.parse(data) : [];
    filtered.forEach((updated: PreventiveMaintenance) => {
      const index = allPreventive.findIndex((p: PreventiveMaintenance) => p.id === updated.id);
      if (index !== -1) allPreventive[index] = updated;
    });
    localStorage.setItem(STORAGE_KEYS.preventive, JSON.stringify(allPreventive));
  }
  return filtered;
};

export const addPreventiveMaintenance = (preventive: Omit<PreventiveMaintenance, 'id'>): PreventiveMaintenance => {
  if (supabase) {
    const hotelId = preventive.hotelId;
    api.insertPreventive(preventive).then((inserted) => {
      if (inserted && preventiveCache[hotelId]) {
        preventiveCache[hotelId] = [...preventiveCache[hotelId], inserted];
        notify();
      }
    }).catch(console.error);
    return { ...preventive, id: `preventive-temp-${Date.now()}` };
  }
  const allPreventive = getPreventiveMaintenance();
  const newPreventive = { ...preventive, id: `preventive${Date.now()}` };
  allPreventive.push(newPreventive);
  localStorage.setItem(STORAGE_KEYS.preventive, JSON.stringify(allPreventive));
  return newPreventive;
};

export const updatePreventiveMaintenance = (id: string, updates: Partial<PreventiveMaintenance>): PreventiveMaintenance | null => {
  if (supabase) {
    const hotelId = currentHotelCache?.id;
    const list = hotelId ? preventiveCache[hotelId] : [];
    const index = list?.findIndex(p => p.id === id) ?? -1;
    if (index === -1) return null;
    const current = list![index];
    const nextUpdates = { ...updates };
    if (updates.status === 'completed' && !updates.lastCompletedDate) {
      nextUpdates.lastCompletedDate = new Date().toISOString().split('T')[0];
      const lastDate = new Date(nextUpdates.lastCompletedDate!);
      const nextDate = new Date(lastDate);
      switch (current.frequency) {
        case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }
      nextUpdates.nextDueDate = nextDate.toISOString().split('T')[0];
      nextUpdates.status = 'pending';
    }
    api.updatePreventiveRow(id, nextUpdates).then((updated) => {
      if (updated && hotelId && preventiveCache[hotelId]) {
        const idx = preventiveCache[hotelId].findIndex(p => p.id === id);
        if (idx >= 0) preventiveCache[hotelId][idx] = updated;
        notify();
      }
    }).catch(console.error);
    return { ...current, ...nextUpdates };
  }
  const allPreventive = getPreventiveMaintenance();
  const i = allPreventive.findIndex(p => p.id === id);
  if (i === -1) return null;
  const up = { ...updates };
  if (up.status === 'completed' && !up.lastCompletedDate) {
    up.lastCompletedDate = new Date().toISOString().split('T')[0];
    const current = allPreventive[i];
    const lastDate = new Date(up.lastCompletedDate);
    const nextDate = new Date(lastDate);
    switch (current.frequency) {
      case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
      case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
      case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
    }
    up.nextDueDate = nextDate.toISOString().split('T')[0];
    up.status = 'pending';
  }
  allPreventive[i] = { ...allPreventive[i], ...up };
  localStorage.setItem(STORAGE_KEYS.preventive, JSON.stringify(allPreventive));
  return allPreventive[i];
};

export const deletePreventiveMaintenance = (id: string): boolean => {
  if (supabase) {
    const hotelId = currentHotelCache?.id;
    api.deletePreventiveById(id).then((ok) => {
      if (ok && hotelId && preventiveCache[hotelId]) {
        preventiveCache[hotelId] = preventiveCache[hotelId].filter(p => p.id !== id);
        notify();
      }
    }).catch(console.error);
    if (hotelId && preventiveCache[hotelId]) {
      preventiveCache[hotelId] = preventiveCache[hotelId].filter(p => p.id !== id);
      notify();
      return true;
    }
    return false;
  }
  const allPreventive = getPreventiveMaintenance();
  const filtered = allPreventive.filter(p => p.id !== id);
  if (filtered.length === allPreventive.length) return false;
  localStorage.setItem(STORAGE_KEYS.preventive, JSON.stringify(filtered));
  return true;
};

// ==================== STATISTICS ====================

export const getMaintenanceStats = (hotelId: string, dateRange?: DateRange): MaintenanceStats => {
  const damages = getDamages(hotelId, dateRange);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const completedThisMonth = damages.filter(d => {
    if (!d.completedDate) return false;
    const date = new Date(d.completedDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  
  const totalExpenses = damages
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + d.cost, 0);
  
  const completedRepairs = damages.filter(d => d.status === 'completed').length;
  
  return {
    totalRepairs: damages.length,
    pendingRepairs: damages.filter(d => d.status === 'pending').length,
    completedThisMonth,
    totalExpenses,
    averageRepairCost: completedRepairs > 0 ? totalExpenses / completedRepairs : 0
  };
};

export const getCategoryStats = (hotelId: string, dateRange?: DateRange): CategoryStats[] => {
  const damages = getDamages(hotelId, dateRange);
  const stats: Record<string, CategoryStats> = {};
  
  damages.forEach(d => {
    if (!stats[d.category]) {
      stats[d.category] = { category: d.category, count: 0, totalCost: 0 };
    }
    stats[d.category].count++;
    if (d.status === 'completed') {
      stats[d.category].totalCost += d.cost;
    }
  });
  
  return Object.values(stats).sort((a, b) => b.count - a.count);
};

export const getMonthlyStats = (hotelId: string, dateRange?: DateRange): MonthlyStats[] => {
  const damages = getDamages(hotelId, dateRange);
  const stats: Record<string, MonthlyStats> = {};
  
  const now = new Date();
  const start = dateRange ? new Date(dateRange.start) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const end = dateRange ? new Date(dateRange.end) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthsToInit = dateRange
    ? (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
    : 6;
  
  for (let i = 0; i < monthsToInit; i++) {
    const date = dateRange
      ? new Date(start.getFullYear(), start.getMonth() + i, 1)
      : new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    stats[key] = { month: key, repairs: 0, expenses: 0 };
  }
  
  damages.forEach(d => {
    if (d.status !== 'completed' || !d.completedDate) return;
    const date = new Date(d.completedDate);
    const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (stats[key]) {
      stats[key].repairs++;
      stats[key].expenses += d.cost;
    }
  });
  
  return Object.values(stats);
};

// ==================== EXPORT & RESET ====================

export const exportData = (hotelId: string) => {
  return {
    damages: getDamages(hotelId),
    rooms: getRooms(hotelId),
    stats: getMaintenanceStats(hotelId),
    categoryStats: getCategoryStats(hotelId),
    monthlyStats: getMonthlyStats(hotelId)
  };
};

export const resetData = () => {
  localStorage.setItem(STORAGE_KEYS.damages, JSON.stringify(sampleDamages));
  localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(sampleRooms));
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(defaultUsers));
  localStorage.setItem(STORAGE_KEYS.hotels, JSON.stringify(defaultHotels));
};

export const logout = () => {
  if (supabase) {
    currentUserCache = null;
    currentHotelCache = null;
    sessionStorage.removeItem(CURRENT_HOTEL_KEY);
    damagesCache = {};
    roomsCache = {};
    preventiveCache = {};
    signOutSupabase();
    notify();
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  localStorage.removeItem(STORAGE_KEYS.currentHotel);
  localStorage.removeItem('hotel_maintenance_session');
};

// Re-export types
export type { Hotel, User };
