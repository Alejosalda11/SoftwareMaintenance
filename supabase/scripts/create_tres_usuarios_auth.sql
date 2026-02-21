-- Crea los 3 usuarios (Alejandro, Steven, Camilo) en auth y deja listos los perfiles para login.
-- Ejecutar en Supabase: SQL Editor > New query > pegar y Run.
-- Contraseña para los 3: admin123

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Eliminar usuarios si ya existen (para poder re-ejecutar el script)
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('alejandro@hotel.com', 'steven@hotel.com', 'camilo@hotel.com'));
DELETE FROM auth.users WHERE email IN ('alejandro@hotel.com', 'steven@hotel.com', 'camilo@hotel.com');

DO $$
DECLARE
  v_id_alejandro UUID := gen_random_uuid();
  v_id_steven    UUID := gen_random_uuid();
  v_id_camilo    UUID := gen_random_uuid();
  v_pw           TEXT := crypt('admin123', gen_salt('bf'));
  v_instance     UUID := '00000000-0000-0000-0000-000000000000';
  v_meta         TEXT := '{"provider":"email","providers":["email"]}';
BEGIN
  -- Alejandro (superadmin)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    v_id_alejandro, v_instance, 'authenticated', 'authenticated', 'alejandro@hotel.com', v_pw, NOW(), v_meta::jsonb,
    '{"name":"Alejandro Saldarriaga","role":"superadmin","phone":"555-0101","color":"#dc2626","can_delete":true}'::jsonb,
    NOW(), NOW()
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  VALUES (v_id_alejandro, v_id_alejandro, v_id_alejandro::text, format('{"sub":"%s","email":"alejandro@hotel.com"}', v_id_alejandro)::jsonb, 'email', NOW(), NOW());

  -- Steven (admin)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    v_id_steven, v_instance, 'authenticated', 'authenticated', 'steven@hotel.com', v_pw, NOW(), v_meta::jsonb,
    '{"name":"Steven Ramirez","role":"admin","phone":"555-0102","color":"#3b82f6","can_delete":false}'::jsonb,
    NOW(), NOW()
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  VALUES (v_id_steven, v_id_steven, v_id_steven::text, format('{"sub":"%s","email":"steven@hotel.com"}', v_id_steven)::jsonb, 'email', NOW(), NOW());

  -- Camilo (admin)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    v_id_camilo, v_instance, 'authenticated', 'authenticated', 'camilo@hotel.com', v_pw, NOW(), v_meta::jsonb,
    '{"name":"Camilo Velasquez","role":"admin","phone":"555-0103","color":"#10b981","can_delete":false}'::jsonb,
    NOW(), NOW()
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  VALUES (v_id_camilo, v_id_camilo, v_id_camilo::text, format('{"sub":"%s","email":"camilo@hotel.com"}', v_id_camilo)::jsonb, 'email', NOW(), NOW());
END $$;

-- El trigger on_auth_user_created crea las filas en public.profiles. Si no existiera, descomenta y ajusta:
-- INSERT INTO public.profiles (id, name, role, phone, email, color, can_delete)
-- SELECT u.id, (u.raw_user_meta_data->>'name'), (u.raw_user_meta_data->>'role'), (u.raw_user_meta_data->>'phone'), u.email, COALESCE(u.raw_user_meta_data->>'color','#3b82f6'), COALESCE((u.raw_user_meta_data->>'can_delete')::boolean, false)
-- FROM auth.users u WHERE u.email IN ('alejandro@hotel.com','steven@hotel.com','camilo@hotel.com')
-- ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, phone = EXCLUDED.phone, email = EXCLUDED.email, color = EXCLUDED.color, can_delete = EXCLUDED.can_delete;
