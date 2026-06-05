-- 🔧 SOLUCIÓN: Disable RLS temporalmente para crear super admin
-- Ejecuta PRIMERO este comando

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Ahora ejecuta el UPDATE
UPDATE public.users 
SET role = 'super_admin' 
WHERE id = '58ff1a79-d695-4a70-9817-689e5caf2ce1';

-- Verifica que funcionó
SELECT id, email, role FROM public.users WHERE id = '58ff1a79-d695-4a70-9817-689e5caf2ce1';

-- ✅ Deberías ver: role = 'super_admin'

-- Ahora vuelve a ACTIVAR RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verificación final
SELECT COUNT(*) as super_admin_count FROM public.users WHERE role = 'super_admin';

-- Resultado debe ser: 1
