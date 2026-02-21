# Supabase setup for Hotel Maintenance Pro

## 1. Create a project

Create a project at [Supabase](https://supabase.com). In **Settings > API** copy the **Project URL** and **anon public** key.

## 2. Run the migration

In the Supabase dashboard open **SQL Editor** and run the contents of `migrations/20250221000001_schema.sql`. This creates tables (hotels, profiles, hotel_access, damages, rooms, preventive_maintenance) and RLS policies.

## 3. Create the first user

- Go to **Authentication > Users** and click **Add user**.
- Email: e.g. `alejandro@hotel.com`
- Password: e.g. `admin123`
- Under **User Metadata** add: `{"name":"Alejandro Saldarriaga","role":"superadmin","phone":"555-0101","color":"#dc2626","avatar":"AS","can_delete":true}` (optional; the trigger will create a profile with defaults from metadata).

After the user is created, a row in `profiles` is created by the trigger. You can edit the profile in **Table Editor > profiles** (name, role, avatar image URL, etc.).

## 4. Add hotels

In **Table Editor > hotels** add rows (or use the app after login: Admin Settings > Hotels). Columns: name, address, total_rooms, color, image (optional logo URL or base64).

## 5. App env

In the app folder create `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then run `npm run dev`. Login with the user you created. Without these env vars the app falls back to localStorage.
