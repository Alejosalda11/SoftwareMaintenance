# Supabase setup for Hotel Maintenance Pro

## 1. Create a project

Create a project at [Supabase](https://supabase.com). In **Settings > API** copy the **Project URL** and **anon public** key.

## 2. Run the migration

In the Supabase dashboard open **SQL Editor** and run the contents of `migrations/20250221000001_schema.sql`. This creates tables (hotels, profiles, hotel_access, damages, rooms, preventive_maintenance) and RLS policies.

## 3. Allow users to sign in without confirming email (recomendado para desarrollo)

Si no puedes entrar después de crear un usuario, suele ser porque Supabase exige "Confirm email".

- Ve a **Authentication > Providers > Email**.
- Desactiva **"Confirm email"** (o en **Authentication > Users**, al añadir usuario, marca **"Auto Confirm User"** si aparece).

Así los usuarios pueden iniciar sesión en cuanto los creas.

## 4. Create the first user

- Go to **Authentication > Users** and click **Add user**.
- Email: e.g. `alejandro@hotel.com`
- Password: e.g. `admin123`
- If available, check **Auto Confirm User** so they can log in immediately.
- Under **User Metadata** (optional) add: `{"name":"Alejandro Saldarriaga","role":"superadmin","phone":"555-0101","color":"#dc2626","avatar":"AS","can_delete":true}`. The trigger will create a row in `profiles`; you can edit it later in **Table Editor > profiles**.

## 5. Add hotels

In **Table Editor > hotels** add rows (or use the app after login: Admin Settings > Hotels). Columns: name, address, total_rooms, color, image (optional logo URL or base64).

## 6. App env

In the app folder create `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then run `npm run dev`. Login with the user you created. Without these env vars the app falls back to localStorage.
