# 📅 SISTEMA AVANZADO DE ASIGNACIÓN DE SEMANAS

## 🎯 Qué cambió

Ya **NO solo asignas días**, ahora puedes:

✅ **Elegir semana específica del mes**
✅ **Especificar mes y año** 
✅ **Asignar horarios por día dentro de esa semana**
✅ **Reutilizar la misma estructura para diferentes semanas**

---

## 📊 Estructura de la Base de Datos

La tabla `schedules` ahora tiene:

```typescript
{
  id: string                 // ID único
  employee_id: string        // A qué empleado
  tenant_id: string          // Qué empresa
  day_of_week: number        // 1=Lun, 2=Mar... 7=Dom
  start_time: string         // "09:00"
  end_time: string           // "17:00"
  
  // ⭐ NUEVO: Contexto temporal
  week_number: number        // 1-5 (semana del mes)
  month: number              // 1-12
  year: number               // 2024, 2025, etc
  start_date: string         // "2025-04-01"
  end_date: string           // "2025-04-07"
  created_at: string         // Cuándo se creó
}
```

---

## 🎨 Cómo Usar el Componente

### Ubicación
- **Ir a**: Admin → Empleados → [Seleccionar Empleado] → "Asignar Semanas de Trabajo"

### Flujo

1. **Navega entre Meses/Años**
   - Botones ◀ ▶ para cambiar mes
   - Se actualiza automáticamente el año

2. **Selecciona una Semana**
   - Click en la tarjeta de la semana
   - Se expande mostrando los 7 días

3. **Elige Días de Trabajo**
   - ☑️ Marca los días que trabaja ese empleado
   - ☐ Deja sin marcar si no trabaja

4. **Especifica Horarios**
   - 🕐 Hora de entrada (ej: 09:00)
   - 🕑 Hora de salida (ej: 17:00)
   - Solo aparece si el día está ✓ marcado

5. **Guarda**
   - Botón "✓ Guardar Semana"
   - Se guarda con contexto: semana #, mes, año

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Empleado trabaja semana 1 y 3 del mes
```
Mayo 2025
├─ Semana 1 (1-5 mayo) → Lun-Vie: 09:00-17:00
├─ Semana 2 (6-12 mayo) → (sin marcar, NO trabaja)
├─ Semana 3 (13-19 mayo) → Lun-Vie: 09:00-17:00
└─ Semana 4 (20-26 mayo) → (sin marcar)
```

### Ejemplo 2: Empleado con horario reducido
```
Junio 2025
└─ Semana 2 (9-15 junio) → 
   - Lun, Mié, Vie: 08:00-13:00
   - Mar, Jue: (sin marcar)
```

### Ejemplo 3: Cambios de horario por temporada
```
Enero 2025 → Semana 1: Lun-Vie 09:00-17:00
Febrero 2025 → Semana 1: Lun-Vie 08:00-18:00 (horario extendido)
```

---

## 🔍 Cómo Consultar los Horarios

### Desde el Servidor

```typescript
import { getEmployeeSchedules } from '@/lib/actions/schedules'

// Obtener horarios de Mayo 2025
const result = await getEmployeeSchedules(employeeId, 2025, 5)
// Retorna todos los días configurados para mayo 2025
```

### En el Componente

El historial se muestra en **"Historial de Configuración"** debajo del selector de semanas, con el componente `ScheduleManager`.

---

## 📝 Validaciones Automáticas

- ✅ No permite guardar si no hay días seleccionados
- ✅ No permite horarios inválidos (ej: salida antes que entrada)
- ✅ Automáticamente asocia start_date y end_date a la semana
- ✅ Previene duplicados (upsert inteligente)

---

## 🚀 Próximas Mejoras Posibles

- [ ] Vista de calendario visual
- [ ] Importar/Exportar horarios en CSV/PDF
- [ ] Clonar horarios entre semanas
- [ ] Alertas si hay cambios en horarios
- [ ] Reporte de horas trabajadas vs. programadas
- [ ] Integración con asistencia automática

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo asignar horarios recurrentes (cada lunes)?**
A: Ahora tienes más control. Puedes asignar la misma estructura manualmente a cada semana, o podríamos crear un "patrón recurrente" en el futuro.

**P: ¿Qué pasa si cambio el horario después?**
A: Cada guardado crea un nuevo registro, así tienes historial completo en "Historial de Configuración".

**P: ¿Funciona con roles diferentes (admin, gerente, empleado)?**
A: Solo admin puede asignar. Los empleados ven sus horarios en su panel.

---

¿Necesitas ayuda para integrarlo o agregar más features? 🎯
