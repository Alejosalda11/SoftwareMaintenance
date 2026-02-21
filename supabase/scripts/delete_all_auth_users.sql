-- Elimina todos los usuarios de Authentication (y sus perfiles por CASCADE).
-- Ejecutar en Supabase SQL Editor solo si quieres empezar de cero.
-- Después crea 2 usuarios desde la app (Admin > Add User) con contraseña de al menos 6 caracteres.

DELETE FROM auth.users;
