# Supabase RLS (Row Level Security) for Hotel Maintenance Pro

If the app uses Supabase and you see data in the Table Editor but **no rows in the app** (e.g. damages list empty), RLS is usually blocking reads. The dashboard bypasses RLS; the client uses your anon/authenticated key and is subject to policies.

Apply the following in the Supabase Dashboard: **Table Editor** > select table > **RLS** (or **Authentication > Policies**).

## 1. Enable RLS and add policies

Ensure RLS is enabled on each table. Then add policies so the app can read (and optionally write) data.

### Option A: Allow authenticated users to read all rows

Use this if your app logs in with Supabase Auth and you want any logged-in user to see all hotels/damages/rooms.

**hotels**

```sql
CREATE POLICY "Allow read for authenticated"
ON public.hotels FOR SELECT
TO authenticated
USING (true);
```

**damages**

```sql
CREATE POLICY "Allow read for authenticated"
ON public.damages FOR SELECT
TO authenticated
USING (true);
```

**rooms**

```sql
CREATE POLICY "Allow read for authenticated"
ON public.rooms FOR SELECT
TO authenticated
USING (true);
```

**preventive_maintenance**

```sql
CREATE POLICY "Allow read for authenticated"
ON public.preventive_maintenance FOR SELECT
TO authenticated
USING (true);
```

**profiles** (needed for user list and current user)

```sql
CREATE POLICY "Allow read for authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
```

Add `FOR INSERT`, `FOR UPDATE`, `FOR DELETE` policies on the same tables if the app should create/update/delete (e.g. same `TO authenticated` and `USING (true)` / `WITH CHECK (true)`).

### Option B: Allow anon to read (e.g. for development or internal tools)

Only if it is acceptable for unauthenticated clients to read data:

```sql
-- Repeat for: hotels, damages, rooms, preventive_maintenance, profiles
CREATE POLICY "Allow read for anon"
ON public.damages FOR SELECT
TO anon
USING (true);
```

### Option C: Restrict by hotel (e.g. using hotel_access)

If you have a `hotel_access` table linking users to hotels, you can restrict damages/rooms to those hotels:

```sql
-- Example: damages only for hotels the user can access
CREATE POLICY "Allow read damages by hotel access"
ON public.damages FOR SELECT
TO authenticated
USING (
  hotel_id IN (
    SELECT hotel_id FROM public.hotel_access
    WHERE user_id = auth.uid()
  )
);
```

Apply similar `USING` conditions for `rooms` and `preventive_maintenance` if you use `hotel_access`.

## 2. After adding policies

- Reload the app and select a hotel whose `id` matches the `hotel_id` of the damages in the database.
- If the list is still empty, check the browser console for errors and the Network tab for the Supabase request to `damages` (response body and status).

## 3. References

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- Plan: **Registros damages visibles en app** (RLS and hotel selection).
