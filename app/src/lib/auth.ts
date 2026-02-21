// Hotel Maintenance Pro - Authentication (Supabase when configured, else localStorage)

import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

// ---------- Supabase auth ----------
let sessionCache: { userId: string } | null = null;

export async function initAuth(): Promise<void> {
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  sessionCache = session?.user ? { userId: session.user.id } : null;
}

supabase?.auth.onAuthStateChange((_event, session) => {
  sessionCache = session?.user ? { userId: session.user.id } : null;
});

export async function signInWithSupabase(email: string, password: string): Promise<User | null> {
  const result = await signInWithSupabaseAndError(email, password);
  return result.error ? null : result.user ?? null;
}

/** Same as signInWithSupabase but returns the error so the UI can show it (e.g. "Email not confirmed"). */
export async function signInWithSupabaseAndError(
  email: string,
  password: string
): Promise<{ user: User | null; error: { message: string } | null }> {
  if (!supabase) return { user: null, error: { message: 'Supabase not configured' } };
  const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: { message: error.message } };
  if (!user) return { user: null, error: { message: 'Invalid login credentials' } };
  sessionCache = { userId: user.id };
  const profile = await fetchProfileAsUser(user.id);
  if (!profile) return { user: null, error: { message: 'No profile found for this user. Check that the profiles table has a row with this user id.' } };
  return { user: profile, error: null };
}

export async function fetchProfileAsUser(userId: string): Promise<User | null> {
  if (!supabase) return null;
  const { data: row, error } = await supabase
    .from('profiles')
    .select('id, name, role, phone, email, color, avatar, can_delete')
    .eq('id', userId)
    .single();
  if (error || !row) return null;
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone ?? '',
    email: row.email ?? undefined,
    color: row.color ?? '#3b82f6',
    avatar: row.avatar ?? undefined,
    canDelete: row.can_delete ?? false,
  };
}

export async function signOutSupabase(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  sessionCache = null;
}

export function isSupabaseAuth(): boolean {
  return !!supabase;
}

export function getSupabaseUserId(): string | null {
  return sessionCache?.userId ?? null;
}

/** Create a new auth user (for Admin add user). Returns new user id or null. */
export async function signUpNewUser(
  email: string,
  password: string,
  metadata: { name: string; role: string; phone?: string; color?: string; avatar?: string; can_delete?: boolean }
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error || !data.user) return null;
  return data.user.id;
}

// ---------- Legacy (localStorage) auth ----------
const SESSION_KEY = 'hotel_maintenance_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

interface Session {
  userId: string;
  expiresAt: number;
}

function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

export function createSession(userId: string): void {
  const session: Session = { userId, expiresAt: Date.now() + SESSION_DURATION };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  if (supabase) {
    const uid = getSupabaseUserId();
    return uid ? { userId: uid, expiresAt: Date.now() + 1e10 } : null;
  }
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    const session: Session = JSON.parse(data);
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionCache = null;
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function hashPassword(password: string): string {
  return simpleHash(password);
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return simpleHash(password) === hashedPassword;
}

export function authenticateUser(email: string, password: string, users: User[]): User | null {
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!user || !user.password?.trim()) return null;
  if (!verifyPassword(password, user.password)) return null;
  return user;
}
