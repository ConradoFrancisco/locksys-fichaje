-- SQL para crear un SUPER ADMIN (Usuario Único)
-- Ejecutá esto en tu Supabase SQL Editor

-- ⚠️ REEMPLAZA "admin@example.com" con el email que vas a usar
-- ⚠️ El usuario DEBE EXISTIR ya en Supabase Auth

-- Paso 1: Obtén el USER_ID del usuario que creaste
-- En Supabase → Authentication → Users
-- Copia el UUID del usuario

-- Paso 2: Ejecuta este comando con el USER_ID correcto
UPDATE public.users 
SET role = 'super_admin' 
WHERE id = '58ff1a79-d695-4a70-9817-689e5caf2ce1'; 
-- Reemplaza con el UUID del usuario

-- Paso 3: Verifica que se haya actualizado
SELECT id, email, role FROM public.users WHERE role = 'super_admin';

-- Si ves 1 resultado con rol 'super_admin', está listo! ✅
