'use client'

import { updateEmployee } from '@/lib/actions/employees'
import { LayoutGrid, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface Props {
  employeeId: string
  departmentId: string | null
  departments: any[]
}

export function DepartmentSelector({ employeeId, departmentId, departments }: Props) {
  const [isPending, startTransition] = useTransition()
  
  const handleChange = (newId: string) => {
    startTransition(async () => {
      const result = await updateEmployee(employeeId, { departmentId: newId || null })
      if (result.success) {
        toast.success('Área actualizada correctamente')
      } else {
        toast.error(result.error || 'Error al actualizar área')
      }
    })
  }

  return (
    <div className="relative group">
      <select
        disabled={isPending}
        value={departmentId || ''}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full bg-transparent text-sm font-black text-white outline-none cursor-pointer appearance-none pr-8 transition-opacity ${isPending ? 'opacity-50' : ''}`}
      >
        <option value="" className="bg-slate-900 text-slate-500">Sin área asignada</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id} className="bg-slate-900 text-white">
            {dept.name} {dept.default_hours ? `(${dept.default_hours}hs)` : ''}
          </option>
        ))}
      </select>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
        ) : (
          <LayoutGrid className="h-3 w-3 text-slate-500 group-hover:text-indigo-500 transition-colors" />
        )}
      </div>
    </div>
  )
}
