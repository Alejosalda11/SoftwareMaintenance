-- Fix 500 on profiles: RLS policies were reading from profiles again (recursion).
-- This adds a SECURITY DEFINER helper so the check does not trigger RLS.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Drop policies that cause recursion
DROP POLICY IF EXISTS "Superadmin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read profiles with shared hotel" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can manage all profiles" ON public.profiles;

-- Recreate using the helper (no read from profiles inside RLS)
CREATE POLICY "Superadmin can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'superadmin');

CREATE POLICY "Admins can read profiles with shared hotel"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() IN ('admin', 'superadmin')
    AND EXISTS (
      SELECT 1 FROM public.hotel_access ha
      WHERE ha.user_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.hotel_access ha2 WHERE ha2.user_id = profiles.id AND ha2.hotel_id = ha.hotel_id)
    )
  );

CREATE POLICY "Superadmin can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'superadmin')
  WITH CHECK (public.current_user_role() = 'superadmin');

-- Fix hotel_access policies that also read from profiles (can cause 500 when loading app)
DROP POLICY IF EXISTS "Users can read own hotel access" ON public.hotel_access;
DROP POLICY IF EXISTS "Superadmin and admin can manage hotel access" ON public.hotel_access;

CREATE POLICY "Users can read own hotel access"
  ON public.hotel_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('superadmin', 'admin'));

CREATE POLICY "Superadmin and admin can manage hotel access"
  ON public.hotel_access FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('superadmin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('superadmin', 'admin'));
