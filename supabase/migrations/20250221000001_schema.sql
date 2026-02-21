-- Hotel Maintenance Pro - Supabase schema
-- Run this in Supabase SQL Editor or via supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hotels
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  total_rooms INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  image TEXT
);

-- Profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'handyman')),
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  avatar TEXT,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Which hotels each user can access (empty for superadmin = all hotels)
CREATE TABLE IF NOT EXISTS public.hotel_access (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, hotel_id)
);

-- Damages (repairs)
CREATE TABLE IF NOT EXISTS public.damages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  reported_date DATE NOT NULL,
  completed_date DATE,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  materials JSONB DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  reported_by TEXT NOT NULL,
  assigned_to TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'Standard',
  status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'maintenance', 'out-of-order')),
  PRIMARY KEY (hotel_id, number)
);

-- Preventive maintenance
CREATE TABLE IF NOT EXISTS public.preventive_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_number TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  next_due_date DATE NOT NULL,
  last_completed_date DATE,
  assigned_to TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_damages_hotel_id ON public.damages(hotel_id);
CREATE INDEX IF NOT EXISTS idx_damages_reported_date ON public.damages(reported_date);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON public.rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_preventive_hotel_id ON public.preventive_maintenance(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_access_user_id ON public.hotel_access(user_id);

-- RLS
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preventive_maintenance ENABLE ROW LEVEL SECURITY;

-- Helper: user has access to a hotel (either superadmin or in hotel_access)
CREATE OR REPLACE FUNCTION public.user_has_hotel_access(user_id UUID, hotel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'superadmin') THEN
    RETURN TRUE;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.hotel_access WHERE hotel_access.user_id = user_id AND hotel_access.hotel_id = user_has_hotel_access.hotel_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hotels: authenticated users can read hotels they have access to
CREATE POLICY "Users can read accessible hotels"
  ON public.hotels FOR SELECT
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), id));

CREATE POLICY "Superadmin and admin can manage hotels"
  ON public.hotels FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Profiles: users can read own profile; superadmin can read all; admins can read users with shared hotel access
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Superadmin can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin'));

CREATE POLICY "Admins can read profiles with shared hotel"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.hotel_access ha ON ha.user_id = p.id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
      AND EXISTS (SELECT 1 FROM public.hotel_access ha2 WHERE ha2.user_id = profiles.id AND ha2.hotel_id = ha.hotel_id)
    )
  );

CREATE POLICY "Superadmin can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Hotel access: read/write by superadmin and admin
CREATE POLICY "Users can read own hotel access"
  ON public.hotel_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin')));

CREATE POLICY "Superadmin and admin can manage hotel access"
  ON public.hotel_access FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin')));

-- Damages: CRUD for hotels user has access to
CREATE POLICY "Users can read damages for accessible hotels"
  ON public.damages FOR SELECT
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Users can insert damages for accessible hotels"
  ON public.damages FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Users can update damages for accessible hotels"
  ON public.damages FOR UPDATE
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), hotel_id))
  WITH CHECK (public.user_has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Users can delete damages for accessible hotels"
  ON public.damages FOR DELETE
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), hotel_id));

-- Rooms: same pattern
CREATE POLICY "Users can read rooms for accessible hotels"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Users can update rooms for accessible hotels"
  ON public.rooms FOR UPDATE
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), hotel_id))
  WITH CHECK (public.user_has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Superadmin and admin can insert/delete rooms"
  ON public.rooms FOR ALL
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), hotel_id))
  WITH CHECK (public.user_has_hotel_access(auth.uid(), hotel_id));

-- Preventive maintenance: same as damages
CREATE POLICY "Users can read preventive for accessible hotels"
  ON public.preventive_maintenance FOR SELECT
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Users can insert preventive for accessible hotels"
  ON public.preventive_maintenance FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Users can update preventive for accessible hotels"
  ON public.preventive_maintenance FOR UPDATE
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), hotel_id))
  WITH CHECK (public.user_has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Users can delete preventive for accessible hotels"
  ON public.preventive_maintenance FOR DELETE
  TO authenticated
  USING (public.user_has_hotel_access(auth.uid(), hotel_id));

-- Trigger to create profile on signup (optional: so first user gets a profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, phone, email, color, avatar, can_delete)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'handyman'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'color', '#3b82f6'),
    NEW.raw_user_meta_data->>'avatar',
    COALESCE((NEW.raw_user_meta_data->>'can_delete')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
