-- Crea/actualiza los perfiles de Alejandro, Steven y Camilo.
-- Antes debes crear los 3 usuarios en Supabase:
--   Authentication > Users > Add user (x3)
--   alejandro@hotel.com / admin123  (Auto Confirm)
--   steven@hotel.com   / admin123   (Auto Confirm)
--   camilo@hotel.com   / admin123   (Auto Confirm)
-- Luego ejecuta este script en SQL Editor.

INSERT INTO public.profiles (id, name, role, phone, email, color, can_delete)
SELECT u.id, v.name, v.role, v.phone, v.email, v.color, v.can_delete
FROM auth.users u
JOIN (VALUES
  ('alejandro@hotel.com', 'Alejandro Saldarriaga', 'superadmin', '555-0101', '#dc2626', true),
  ('steven@hotel.com', 'Steven Ramirez', 'admin', '555-0102', '#3b82f6', false),
  ('camilo@hotel.com', 'Camilo Velasquez', 'admin', '555-0103', '#10b981', false)
) AS v(email, name, role, phone, color, can_delete) ON u.email = v.email
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  color = EXCLUDED.color,
  can_delete = EXCLUDED.can_delete;
