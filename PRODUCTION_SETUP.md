# 🚀 GUÍA DE CONFIGURACIÓN PARA PRODUCCIÓN

## 1️⃣ OBTENER VARIABLES DE SUPABASE

### Paso 1: Ir al Dashboard de Supabase
- Entra a https://app.supabase.com
- Selecciona tu proyecto
- Ve a: **Settings** (ícono de engranaje abajo a la izquierda)

### Paso 2: Obtener URL y ANON_KEY
- En **Settings > API**, encontrarás:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Paso 3: Obtener SERVICE_ROLE_KEY
- En **Settings > API**, desplaza hacia abajo y encontrarás:
  - **Service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`
  - ⚠️ **NUNCA lo compartas ni lo expongas en el cliente**

### Paso 4: Guardar en tu plataforma de hosting
Según dónde despliegues (Vercel, Netlify, Railway, etc.):

#### **Si usas Vercel:**
1. Ve al proyecto en Vercel Dashboard
2. **Settings > Environment Variables**
3. Agrega cada variable:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. Asegúrate que `NEXT_PUBLIC_*` esté disponible en **Production**, **Preview** y **Development**
5. El `SUPABASE_SERVICE_ROLE_KEY` solo en **Production** (opcional en Preview)

#### **Si usas Netlify:**
1. Ve a **Site settings > Build & deploy > Environment**
2. Agrega las mismas variables

#### **Si usas Railway:**
1. Ve a tu proyecto > **Variables**
2. Agrega las variables

---

## 2️⃣ CONFIGURAR OAUTH (Google, GitHub, etc.)

### En Supabase Dashboard:

#### **Para Google OAuth:**
1. Ve a **Authentication > Providers > Google**
2. Activa el proveedor
3. Necesitas:
   - **Client ID** (de Google Cloud Console)
   - **Client Secret** (de Google Cloud Console)

   **Cómo obtenerlos:**
   - Entra a https://console.cloud.google.com/
   - Crear proyecto nuevo o seleccionar uno existente
   - APIs & Services > Credentials
   - Crear "OAuth 2.0 Client ID" (tipo: Web application)
   - Authorized redirect URIs:
     ```
     http://localhost:3000/auth/callback
     https://your-domain.com/auth/callback
     ```
   - Supabase también agrega automáticamente: `https://your-project.supabase.co/auth/v1/callback`

4. Copia el Client ID y Secret en la configuración de Supabase

#### **Para GitHub OAuth:**
1. Ve a **Authentication > Providers > GitHub**
2. Activa el proveedor
3. Necesitas:
   - **Client ID** (de GitHub)
   - **Client Secret** (de GitHub)

   **Cómo obtenerlos:**
   - Entra a https://github.com/settings/apps
   - New GitHub App o New OAuth App
   - Authorized callback URLs:
     ```
     http://localhost:3000/auth/callback
     https://your-domain.com/auth/callback
     ```

---

## 3️⃣ CONFIGURAR TU DOMINIO

### URL de la aplicación:
En tu `.env.local` (desarrollo) o variables del hosting (producción):

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

Esto se usa para:
- URLs de OAuth callback
- Links de confirmación de email
- Links de recuperación de contraseña

---

## 4️⃣ CONFIGURAR EMAIL (Opcional pero Recomendado)

Si quieres usar emails de confirmación en lugar del default de Supabase:

1. Ve a **Authentication > Email Templates**
2. Personaliza los templates de:
   - Confirmación de email
   - Reset de contraseña
   - Magic Link

O configura tu propio SMTP:
- **Authentication > Email**
- Enable "Use your own SMTP"
- Agrega datos del servidor SMTP

---

## 5️⃣ CHECKLIST FINAL ANTES DE PRODUCCIÓN

- [ ] `NEXT_PUBLIC_SUPABASE_URL` guardada en producción
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` guardada en producción
- [ ] `SUPABASE_SERVICE_ROLE_KEY` guardada en producción (servidor solo)
- [ ] `NEXT_PUBLIC_APP_URL` apunta a tu dominio real
- [ ] OAuth providers configurados en Supabase
- [ ] Redirect URIs de OAuth incluyen tu dominio
- [ ] HTTPS habilitado en tu dominio
- [ ] Supabase RLS (Row Level Security) configurado
- [ ] Tests de login/registro funcionando en producción
- [ ] Tests de OAuth funcionando en producción

---

## 6️⃣ SEGURIDAD IMPORTANTE

- ✅ Usa `NEXT_PUBLIC_*` **SOLO** para variables que pueden estar públicas
- ❌ **NUNCA** expongas `SUPABASE_SERVICE_ROLE_KEY` en el cliente
- ✅ Habilita 2FA en tu cuenta de Supabase
- ✅ Usa policies (RLS) en tus tablas
- ✅ Limpia secretos del git con `.gitignore`

---

## 7️⃣ PROBLEMAS COMUNES

### "Auth callback failed"
- Verifica que el redirect URI en OAuth esté correcto
- Comprueba que las variables de Supabase son correctas
- Revisa los logs: Supabase > Auth > Logs

### "CORS error"
- Asegúrate que tu dominio esté permitido en Supabase
- Ve a: Authentication > URL Configuration

### "No se puede hacer login con OAuth"
- Verifica Client ID y Client Secret
- Comprueba que OAuth está activado en Supabase
- Revisa los authorized redirect URIs

---

¿Necesitas ayuda con algo específico? 😊
