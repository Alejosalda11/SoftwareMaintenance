// Hotel Maintenance Pro - Supabase API (row mapping and fetch/mutate)

import { supabase } from '@/lib/supabase';
import type { Damage, Room, Hotel, User, PreventiveMaintenance } from '@/types';

function rowToHotel(r: Record<string, unknown>): Hotel {
  return {
    id: r.id as string,
    name: r.name as string,
    address: (r.address as string) ?? '',
    totalRooms: (r.total_rooms as number) ?? 0,
    color: (r.color as string) ?? '#3b82f6',
    image: (r.image as string) || undefined,
  };
}

function rowToUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    name: r.name as string,
    role: r.role as User['role'],
    phone: (r.phone as string) ?? '',
    email: (r.email as string) || undefined,
    color: (r.color as string) ?? '#3b82f6',
    avatar: (r.avatar as string) || undefined,
    canDelete: (r.can_delete as boolean) ?? false,
  };
}

function rowToDamage(r: Record<string, unknown>): Damage {
  return {
    id: r.id as string,
    hotelId: r.hotel_id as string,
    roomNumber: r.room_number as string,
    category: r.category as Damage['category'],
    description: r.description as string,
    status: r.status as Damage['status'],
    priority: r.priority as Damage['priority'],
    reportedDate: r.reported_date as string,
    completedDate: (r.completed_date as string) || undefined,
    cost: Number(r.cost ?? 0),
    materials: Array.isArray(r.materials) ? r.materials as string[] : [],
    itemsUsed: Array.isArray(r.items_used) ? (r.items_used as Damage['itemsUsed']) : undefined,
    notes: (r.notes as string) ?? '',
    reportedBy: r.reported_by as string,
    assignedTo: (r.assigned_to as string) || undefined,
    images: Array.isArray(r.images) ? (r.images as Damage['images']) : [],
    lastEditedAt: (r.last_edited_at as string) || undefined,
  };
}

function rowToRoom(r: Record<string, unknown>): Room {
  return {
    hotelId: r.hotel_id as string,
    number: r.number as string,
    floor: (r.floor as number) ?? 1,
    type: (r.type as string) ?? 'Standard',
    status: r.status as Room['status'],
  };
}

function rowToPreventive(r: Record<string, unknown>): PreventiveMaintenance {
  return {
    id: r.id as string,
    hotelId: r.hotel_id as string,
    roomNumber: (r.room_number as string) || undefined,
    category: r.category as PreventiveMaintenance['category'],
    title: r.title as string,
    description: (r.description as string) ?? '',
    frequency: r.frequency as PreventiveMaintenance['frequency'],
    nextDueDate: r.next_due_date as string,
    lastCompletedDate: (r.last_completed_date as string) || undefined,
    assignedTo: (r.assigned_to as string) || undefined,
    status: r.status as PreventiveMaintenance['status'],
  };
}

export async function fetchHotels(): Promise<Hotel[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('hotels').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(rowToHotel);
}

export async function fetchProfiles(): Promise<User[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('profiles').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(rowToUser);
}

export async function fetchDamages(hotelId: string): Promise<Damage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('damages')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('reported_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToDamage);
}

export async function fetchRooms(hotelId: string): Promise<Room[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('number');
  if (error) throw error;
  return (data ?? []).map(rowToRoom);
}

export async function fetchPreventive(hotelId: string): Promise<PreventiveMaintenance[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('preventive_maintenance')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('next_due_date');
  if (error) throw error;
  const rows = (data ?? []) as Record<string, unknown>[];
  return rows.map(rowToPreventive);
}

export async function fetchHotelById(id: string): Promise<Hotel | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('hotels').select('*').eq('id', id).single();
  if (error || !data) return null;
  return rowToHotel(data as Record<string, unknown>);
}

// Mutations
function damageToRow(d: Partial<Damage>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (d.hotelId != null) row.hotel_id = d.hotelId;
  if (d.roomNumber != null) row.room_number = d.roomNumber;
  if (d.category != null) row.category = d.category;
  if (d.description != null) row.description = d.description;
  if (d.status != null) row.status = d.status;
  if (d.priority != null) row.priority = d.priority;
  if (d.reportedDate != null) row.reported_date = d.reportedDate;
  if (d.completedDate != null) row.completed_date = d.completedDate;
  if (d.cost != null) row.cost = d.cost;
  if (d.materials != null) row.materials = d.materials;
  if (d.itemsUsed != null) row.items_used = d.itemsUsed;
  if (d.notes != null) row.notes = d.notes;
  if (d.reportedBy != null) row.reported_by = d.reportedBy;
  if (d.assignedTo != null) row.assigned_to = d.assignedTo;
  if (d.images != null) row.images = d.images;
  if (d.lastEditedAt != null) row.last_edited_at = d.lastEditedAt;
  return row;
}

export async function insertDamage(damage: Omit<Damage, 'id'>): Promise<Damage | null> {
  if (!supabase) return null;
  const row = damageToRow(damage);
  const { data, error } = await supabase.from('damages').insert(row).select('*').single();
  if (error) throw error;
  return data ? rowToDamage(data as Record<string, unknown>) : null;
}

export async function updateDamage(id: string, updates: Partial<Damage>): Promise<Damage | null> {
  if (!supabase) return null;
  const row = damageToRow(updates);
  const { data, error } = await supabase.from('damages').update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return data ? rowToDamage(data as Record<string, unknown>) : null;
}

export async function deleteDamageById(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('damages').delete().eq('id', id);
  return !error;
}

function roomToRow(r: Partial<Room>): Record<string, unknown> {
  return {
    hotel_id: r.hotelId,
    number: r.number,
    floor: r.floor ?? 1,
    type: r.type ?? 'Standard',
    status: r.status,
  };
}

export async function updateRoomRow(hotelId: string, roomNumber: string, updates: Partial<Room>): Promise<Room | null> {
  if (!supabase) return null;
  const row = roomToRow(updates);
  const { data, error } = await supabase
    .from('rooms')
    .update(row)
    .eq('hotel_id', hotelId)
    .eq('number', roomNumber)
    .select('*')
    .single();
  if (error) throw error;
  return data ? rowToRoom(data as Record<string, unknown>) : null;
}

function preventiveToRow(p: Partial<PreventiveMaintenance>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.hotelId != null) row.hotel_id = p.hotelId;
  if (p.roomNumber != null) row.room_number = p.roomNumber;
  if (p.category != null) row.category = p.category;
  if (p.title != null) row.title = p.title;
  if (p.description != null) row.description = p.description;
  if (p.frequency != null) row.frequency = p.frequency;
  if (p.nextDueDate != null) row.next_due_date = p.nextDueDate;
  if (p.lastCompletedDate != null) row.last_completed_date = p.lastCompletedDate;
  if (p.assignedTo != null) row.assigned_to = p.assignedTo;
  if (p.status != null) row.status = p.status;
  return row;
}

export async function insertPreventive(p: Omit<PreventiveMaintenance, 'id'>): Promise<PreventiveMaintenance | null> {
  if (!supabase) return null;
  const row = preventiveToRow(p);
  const { data, error } = await supabase.from('preventive_maintenance').insert(row).select('*').single();
  if (error) throw error;
  return data ? rowToPreventive(data as Record<string, unknown>) : null;
}

export async function updatePreventiveRow(id: string, updates: Partial<PreventiveMaintenance>): Promise<PreventiveMaintenance | null> {
  if (!supabase) return null;
  const row = preventiveToRow(updates);
  const { data, error } = await supabase.from('preventive_maintenance').update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return data ? rowToPreventive(data as Record<string, unknown>) : null;
}

export async function deletePreventiveById(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('preventive_maintenance').delete().eq('id', id);
  return !error;
}

export async function insertHotel(hotel: Omit<Hotel, 'id'>): Promise<Hotel | null> {
  if (!supabase) return null;
  const row = {
    name: hotel.name,
    address: hotel.address,
    total_rooms: hotel.totalRooms,
    color: hotel.color,
    image: hotel.image ?? null,
  };
  const { data, error } = await supabase.from('hotels').insert(row).select('*').single();
  if (error) throw error;
  return data ? rowToHotel(data as Record<string, unknown>) : null;
}

export async function updateHotelRow(id: string, updates: Partial<Hotel>): Promise<Hotel | null> {
  if (!supabase) return null;
  const row: Record<string, unknown> = {};
  if (updates.name != null) row.name = updates.name;
  if (updates.address != null) row.address = updates.address;
  if (updates.totalRooms != null) row.total_rooms = updates.totalRooms;
  if (updates.color != null) row.color = updates.color;
  if (updates.image !== undefined) row.image = updates.image ?? null;
  const { data, error } = await supabase.from('hotels').update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return data ? rowToHotel(data as Record<string, unknown>) : null;
}

export async function deleteHotelById(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('hotels').delete().eq('id', id);
  return !error;
}

// Profiles: create/update/delete via Supabase (profiles table; auth.users managed separately)
export async function insertProfile(user: Omit<User, 'id'> & { id: string }): Promise<User | null> {
  if (!supabase) return null;
  const row = {
    id: user.id,
    name: user.name,
    role: user.role,
    phone: user.phone,
    email: user.email ?? null,
    color: user.color,
    avatar: user.avatar ?? null,
    can_delete: user.canDelete ?? false,
  };
  const { data, error } = await supabase.from('profiles').insert(row).select('*').single();
  if (error) throw error;
  return data ? rowToUser(data as Record<string, unknown>) : null;
}

export async function updateProfileRow(id: string, updates: Partial<User>): Promise<User | null> {
  if (!supabase) return null;
  const row: Record<string, unknown> = {};
  if (updates.name != null) row.name = updates.name;
  if (updates.role != null) row.role = updates.role;
  if (updates.phone != null) row.phone = updates.phone;
  if (updates.email !== undefined) row.email = updates.email ?? null;
  if (updates.color != null) row.color = updates.color;
  if (updates.avatar !== undefined) row.avatar = updates.avatar ?? null;
  if (updates.canDelete !== undefined) row.can_delete = updates.canDelete;
  const { data, error } = await supabase.from('profiles').update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return data ? rowToUser(data as Record<string, unknown>) : null;
}

export async function deleteProfileById(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  return !error;
}

export async function insertHotelAccess(userId: string, hotelId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('hotel_access').insert({ user_id: userId, hotel_id: hotelId });
}

export async function deleteHotelAccess(userId: string, hotelId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('hotel_access').delete().eq('user_id', userId).eq('hotel_id', hotelId);
}
