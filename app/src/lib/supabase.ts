// Hotel Maintenance Pro - Supabase client
// Local: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in app/.env and restart dev server.
// Vercel: set both in Project > Settings > Environment Variables, then redeploy.
/// <reference path="../vite-env.d.ts" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = typeof import.meta.env.VITE_SUPABASE_URL === 'string' ? import.meta.env.VITE_SUPABASE_URL.trim() : '';
const supabaseAnonKey = typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim() : '';

const hasValidConfig = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!hasValidConfig) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to app/.env (local) or Vercel Environment Variables (production), then restart/redeploy.'
  );
}

export const supabase = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as ReturnType<typeof createClient> | null);

export const useSupabase = (): boolean => !!supabase;
