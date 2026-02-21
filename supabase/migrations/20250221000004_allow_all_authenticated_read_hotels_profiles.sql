-- Allow all authenticated users (superadmin, admin, handyman) to read hotels and profiles.
-- So admins and handymans can see the list of hotels and users in the app.

-- Hotels: add policy so any authenticated user can read all hotels (existing policy already allows by access; this adds a simple "all read" for listing).
CREATE POLICY "Authenticated can read all hotels"
  ON public.hotels FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: add policy so any authenticated user can read all profiles (for user list in Admin / UserSelection).
CREATE POLICY "Authenticated can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
