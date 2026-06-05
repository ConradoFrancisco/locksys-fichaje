# Super Admin - Guía Rápida

## 🚀 3 pasos para activar

### 1️⃣ SQL en Supabase

1. Supabase Dashboard → SQL Editor → New Query
2. Copia el contenido de `supabase_subscriptions.sql`
3. Ejecuta

### 2️⃣ Crear Usuario

1. Authentication → Users → Create User
2. Email: `admin@tuempresa.com`
3. Password: `tu-contraseña-segura`
4. Copia el **UUID** del usuario

### 3️⃣ Darle rol de Super Admin

1. Abre `CREATE_SUPER_ADMIN.sql`
2. Reemplaza el UUID (los ceros)
3. Ejecuta en SQL Editor de Supabase

---

## 🔑 Credenciales

**URL:** `/superadmin/login`

**Email:** `admin@tuempresa.com`

**Password:** `tu-contraseña-segura`

---

## ✅ ¿Funcionó?

Deberías ver:
- Dashboard con todas las empresas
- Tabla con estadísticas
- Opción de gestionar cada empresa

---

## 🚨 Problemas?

**Se queda cargando:**
- Verifica que el usuario tenga rol `super_admin`

**Error de email/contraseña:**
- Revisa que el usuario exista en Supabase Auth

**No veo las empresas:**
- Revisa que ejecutaste el SQL de `supabase_subscriptions.sql`

