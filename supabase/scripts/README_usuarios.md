# Usuarios en Supabase

## Borrar todos los usuarios

En **SQL Editor** ejecuta el contenido de `delete_all_auth_users.sql`:

```sql
DELETE FROM auth.users;
```

Eso borra todos los usuarios de Authentication; los perfiles en `profiles` se borran en cascada.

## Crear 2 usuarios con el nuevo modelo

Después de borrar no quedan usuarios, así que el primero hay que crearlo desde Supabase; el segundo desde la app.

### Usuario 1 (desde Supabase Dashboard)

1. **Authentication** > **Users** > **Add user**.
2. Email: `alejandro@hotel.com`, Password: `admin123` (o la que quieras, mínimo 6 caracteres).
3. Si aparece **Auto Confirm User**, márcala para que pueda entrar sin confirmar correo.
4. En **User Metadata** (opcional): `{"name":"Alejandro Saldarriaga","role":"superadmin","phone":"555-0101","color":"#dc2626","can_delete":true}`.
5. Guardar. El trigger crea la fila en `profiles`. Si no, en **Table Editor > profiles** añade una fila con ese `id`, `name`, `role`, `email`, etc.

### Usuario 2 (desde la app)

1. Entra a la app con `alejandro@hotel.com` y la contraseña que pusiste.
2. Ve a **Admin Settings** > **Users** > **Add User**.
3. Name: Steven Ramirez, Role: Admin, Email: `steven@hotel.com`, Password: mínimo 6 caracteres (ej. `admin123`).
4. Guardar. Ese usuario ya puede iniciar sesión con su email y esa contraseña.
