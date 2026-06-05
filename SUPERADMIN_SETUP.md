# Sistema de Super Admin y Suscripciones

## 📋 Qué se implementó

### 1. **Favicon** 
- Convertido `lock-sys-logo.png` a `favicon.ico`
- Se muestra automáticamente en las pestañas del navegador

### 2. **Panel de Super Admin** 
- **Acceso:** `https://tuapp.com/superadmin/login`
- **Solo accesible por usuarios con rol `super_admin`**
- Panel exclusivo para gestionar todas las empresas
- Menú con: Dashboard y Empresas

### 3. **Gestión de Suscripciones**
- Nueva tabla `subscriptions` en Supabase con:
  - Estado (active, inactive, suspended, cancelled)
  - Plan (monthly, annual)
  - Precio
  - Fecha de vencimiento
  - Historial de pagos

### 4. **Validación Automática**
- Los empleados **no pueden fichar** si su empresa no tiene suscripción activa
- Se muestra alerta roja en el dashboard del admin
- Mensaje claro cuando la suscripción está vencida

---

## 🚀 Pasos para activar el sistema

### ⭐ Paso 1: Ejecutar el SQL en Supabase

1. Ve a tu **Supabase Dashboard**
2. Click en **SQL Editor** (lado izquierdo)
3. Click en **New Query**
4. Copia TODO el contenido del archivo `supabase_subscriptions.sql`
5. Pégalo en el editor
6. Click en **Run**

✅ Esto crea la tabla de suscripciones automáticamente

---

### ⭐ Paso 2: Crear un USUARIO en Supabase Auth

1. Ve a **Authentication** → **Users** (lado izquierdo)
2. Click en **Create User**
3. Llena:
   - **Email:** el email de tu super admin (ej: `admin@tuempresa.com`)
   - **Password:** una contraseña segura
   - Deja lo demás por defecto
4. Click **Create User**
5. **Copia el UUID** del usuario (aparece en la tabla)

---

### ⭐ Paso 3: Darle rol de SUPER ADMIN

1. Abre el archivo `CREATE_SUPER_ADMIN.sql`
2. **Reemplaza** `00000000-0000-0000-0000-000000000000` con el UUID que copiaste
3. Ve a **SQL Editor** en Supabase
4. Copia y ejecuta el SQL actualizado

✅ Listo! Ya tienes 1 super admin

---

### ⭐ Paso 4: Acceder al Panel

**URL:** `http://localhost:3000/superadmin/login` (o tu dominio)

**Credenciales:**
- Email: el que creaste en Paso 2
- Contraseña: la que creaste en Paso 2

**Resultado esperado:** Ves el dashboard con todas las empresas

---

## ⚠️ Importante: UN SOLO SUPER ADMIN

Para asegurar que solo 1 persona tenga acceso:

```sql
-- Verifica que hay solo 1 super admin
SELECT COUNT(*) FROM public.users WHERE role = 'super_admin';

-- Resultado debe ser: 1
```

Si necesitas cambiar la contraseña de tu super admin:
- Ve a Supabase Auth → Users
- Busca el usuario
- Click en los 3 puntos → **Reset password**

---

## 📊 Cómo usar el Dashboard de Super Admin

### Dashboard Principal
- Ve todas las empresas registradas
- Estadísticas: Total, Activas, Sin Suscripción
- Acceso rápido a gestionar cada empresa

### Gestionar una Empresa

1. Click en **"Gestionar →"** o ve a `/superadmin/empresas/{id}`
2. Ves información actual de la suscripción
3. Opciones:
   - **Activar:** Abre acceso a esa empresa
   - **Desactivar:** Bloquea fichas de empleados
   - **Editar:** Cambiar plan, precio, fechas, notas

### Estados de Suscripción

| Estado | Significado | Empleados pueden fichar |
|--------|------------|------------------------|
| `active` | Suscripción pagada y vigente | ✅ Sí |
| `inactive` | No tiene suscripción | ❌ No |
| `suspended` | Pagó pero está suspendida | ❌ No |
| `cancelled` | Cancelada | ❌ No |

---

## ⏰ Gestión de Vencimientos

### Configurar Fecha de Vencimiento

Cuando activas una empresa:
1. Se establece `started_at` = hoy
2. Se establece `current_period_end` = mismo día del mes siguiente

**Ejemplo:**
- Activas: 15 de Junio
- Vence: 15 de Julio

### Renovaciones Manual

En el panel de super admin:
1. Ve a la empresa
2. Edita `current_period_end` 
3. Guarda cambios

---

## 🚨 Alertas para Empleados

### En el Dashboard del Admin
- Si la suscripción está vencida → **Alerta roja**
- Mensaje: "Suscripción Vencida - Los empleados no pueden fichar"

### Cuando intentan Fichar
- Si la empresa no tiene suscripción → **Error claro**
- Mensaje: "La suscripción de tu empresa no está activa"

---

## 🔒 Seguridad

### Validaciones en Lugar

1. **Base de datos (RLS)**: Solo `super_admin` puede ver/editar suscripciones
2. **Servidor**: Cada acción verifica rol
3. **Cliente**: Layout del super admin redirige a login si no es super admin
4. **Fichas**: Se valida suscripción ANTES de registrar

### Protecciones

```typescript
// En submitAttendance (fichajes):
- Verifica que la empresa tenga suscripción activa
- Verifica que NO esté vencida
- Retorna error claro si algo falla
```

---

## 💰 Modelo de Negocio (Actual)

### Por Ahora (Manual)
- El super admin activa/desactiva empresas manualmente
- Se puede registrar precio en los detalles
- Se registra fecha de vencimiento
- Se registra método de pago (notas)

### Futuro (Integración de Pago)
Cuando quieras agregar pagos automáticos:
1. Integrar **Stripe** o **MercadoPago**
2. Crear tabla de `invoices`
3. Webhook para renovar automáticamente
4. Email de recordatorio antes de vencer

---

## 📝 Archivos Creados

```
/src/app/superadmin/
├── login/page.tsx              ← Login del super admin
├── page.tsx                    ← Dashboard principal
├── empresas/page.tsx           ← Listado de empresas
├── empresas/[id]/page.tsx      ← Gestionar empresa específica
└── layout.tsx                  ← Layout con sidebar

/src/lib/actions/
└── subscriptions.ts            ← Acciones para suscripciones

/src/components/shared/
└── SubscriptionAlert.tsx       ← Alerta visual

SQL:
└── supabase_subscriptions.sql  ← Script para BD

Config:
└── public/favicon.ico          ← Favicon generado
```

---

## 🐛 Testing Rápido

### Test 1: ¿El login funciona?
1. Ve a `/superadmin/login`
2. Ingresa con el email y contraseña del super admin
3. Deberías entrar al dashboard sin problemas

**Esperado:** Ves tabla con todas las empresas ✅

---

### Test 2: ¿Bloquea a usuarios sin acceso?
1. Intenta acceder a `/superadmin` sin estar logueado
2. Deberías redirigirse a `/superadmin/login`

**Esperado:** Redirección automática ✅

---

### Test 3: ¿Bloquea empresas sin suscripción?
1. Selecciona una empresa sin activar
2. Intenta fichar desde la app del empleado
3. Deberías ver: "La suscripción de tu empresa no está activa"

**Esperado:** Error claro ✅

---

## ❓ FAQ

**P: ¿Qué pasa si me olvido la contraseña del super admin?**
- R: Ve a Supabase Auth → Users → Busca el usuario → 3 puntos → Reset password

**P: ¿Puedo tener más de 1 super admin?**
- R: Sí, pero no es recomendado por seguridad. Si lo haces, ejecuta el UPDATE para cada usuario extra.

**P: ¿El login se queda cargando?**
- R: Revisa que:
  1. El usuario exista en Supabase Auth
  2. El usuario tenga rol `super_admin` en la tabla `users`
  3. Las políticas de RLS no lo bloqueen

**P: ¿Cuánto tiempo tarda en entrar al dashboard?**
- R: Debería ser instantáneo. Si tarda, revisa la consola del navegador para errores (F12 → Console).

**P: ¿Cómo hago para NO permitir que se registren nuevas empresas?**
- R: Deshabilita el botón de registro en la página pública o quita la ruta `/register`.

**P: ¿Qué pasa si no activo una empresa?**
- R: Sus empleados ven error al fichar. El admin ve alerta roja en dashboard.

---

## 📞 Próximos Pasos

1. **Ejecutar SQL** en Supabase
2. **Crear super admin** en BD
3. **Probar login** en `/superadmin/login`
4. **Activar empresas** una por una
5. **Comunicar** a los admins sobre las alertas

