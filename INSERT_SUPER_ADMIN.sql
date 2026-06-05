-- 🔧 SOLUCIÓN: Agregar super_admin como rol válido

-- Paso 1: Deshabilita RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Paso 2: Modifica el constraint para incluir 'super_admin'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'employee', 'manager', 'super_admin'));

-- Paso 3: Inserta el super admin
INSERT INTO public.users (id, role)
VALUES ('58ff1a79-d695-4a70-9817-689e5caf2ce1', 'super_admin')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- Paso 4: Verifica
SELECT id, role FROM public.users WHERE id = '58ff1a79-d695-4a70-9817-689e5caf2ce1';

-- Paso 5: Vuelve a activar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ✅ Deberías ver 1 fila con role = 'super_admin'
