'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Fórmula de Haversine para calcular distancia entre dos puntos (lat/long) en metros
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000 // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function submitAttendance(formData: FormData) {
  const supabase = await createClient()

  const employeeId = formData.get('employeeId') as string
  const worksiteId = formData.get('worksiteId') as string
  const userLat = parseFloat(formData.get('lat') as string)
  const userLong = parseFloat(formData.get('long') as string)
  const photoBase64 = formData.get('photo') as string
  const deviceId = formData.get('deviceId') as string

  // 1. Obtener datos del empleado y su horario de hoy
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Domingo, 1 = Lunes, etc.

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select(`
      id, 
      device_id, 
      tenant_id,
      schedules(day_of_week, start_time, end_time)
    `)
    .eq('id', employeeId)
    .eq('schedules.day_of_week', dayOfWeek)
    .single()

  if (empError || !employee) return { error: 'Empleado no encontrado o sin horario para hoy' }

  // 2. Validar Vínculo de Dispositivo
  if (!employee.device_id) {
    await supabase.from('employees').update({ device_id: deviceId }).eq('id', employeeId)
  } else if (employee.device_id !== deviceId) {
    return { error: 'Dispositivo no autorizado. Usá tu teléfono personal vinculado.' }
  }

  // 3. Obtener datos de la Sede (Ubicación y Tolerancia)
  const { data: worksite, error: wsError } = await supabase
    .from('worksites')
    .select('*')
    .eq('id', worksiteId)
    .single()

  if (wsError || !worksite) return { error: 'Sede no encontrada' }

  // 4. Validar Geolocalización
  const distance = calculateDistance(userLat, userLong, worksite.lat, worksite.long)
  if (distance > worksite.radius_meters) {
    return { error: `Fuera de rango. Distancia: ${Math.round(distance)}m. Límite: ${worksite.radius_meters}m.` }
  }

  // 5. CÁLCULO DE LLEGADA TARDE
  let isLate = false
  let lateMinutes = 0

  const schedule = employee.schedules?.[0]
  if (schedule) {
    const [schedHours, schedMins] = schedule.start_time.split(':').map(Number)
    
    // Obtener hora actual en Argentina (-3)
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}))
    const currentHours = now.getHours()
    const currentMins = now.getMinutes()

    const scheduledTotalMins = (schedHours * 60) + schedMins
    const currentTotalMins = (currentHours * 60) + currentMins
    
    // Si la hora actual es mayor a la pactada + tolerancia
    if (currentTotalMins > (scheduledTotalMins + (worksite.tolerance_minutes || 0))) {
      isLate = true
      lateMinutes = currentTotalMins - scheduledTotalMins
    }
  }

  // 6. Subir foto a Storage
  let photoUrl = null
  if (photoBase64) {
    const fileName = `${employee.tenant_id}/${employeeId}/${Date.now()}.jpg`
    const base64Data = photoBase64.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')
    const { error: storageError } = await supabase.storage.from('attendance').upload(fileName, buffer, { contentType: 'image/jpeg' })
    if (!storageError) {
      photoUrl = supabase.storage.from('attendance').getPublicUrl(fileName).data.publicUrl
    }
  }

  // 7. Registrar Asistencia (Diferenciando Entrada de Salida)
  
  // Buscar si ya fichó entrada hoy y no salió
  const { data: activeAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .is('check_out', null)
    .order('check_in', { ascending: false })
    .limit(1)
    .single()

  if (activeAttendance) {
    // ES UNA SALIDA (Check-out)
    const checkIn = new Date(activeAttendance.check_in)
    const checkOut = new Date()
    const diffMs = checkOut.getTime() - checkIn.getTime()
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2))

    const { error: checkoutError } = await supabase
      .from('attendance')
      .update({
        check_out: checkOut.toISOString(),
      })
      .eq('id', activeAttendance.id)

    if (checkoutError) return { error: checkoutError.message }

    revalidatePath('/admin/asistencias')
    return { 
      success: true, 
      message: `Salida registrada. Total hoy: ${totalHours} hs.` 
    }
  } else {
    // ES UNA ENTRADA (Check-in)
    const { error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        tenant_id: employee.tenant_id,
        employee_id: employeeId,
        worksite_id: worksiteId,
        lat: userLat,
        long: userLong,
        photo_url: photoUrl,
        device_id: deviceId,
        check_in: new Date().toISOString(),
        is_late: isLate,
        late_minutes: lateMinutes
      })

    if (attendanceError) return { error: attendanceError.message }

    revalidatePath('/admin/asistencias')
    return { 
      success: true, 
      message: isLate ? `Entrada exitosa (Llegada tarde: ${lateMinutes} min)` : 'Entrada exitosa. ¡Puntual!' 
    }
  }
}
