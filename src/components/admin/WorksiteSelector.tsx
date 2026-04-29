'use client'

import { updateEmployee } from '@/lib/actions/employees'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  employeeId: string
  worksiteId: string | null
  worksites: any[]
}

export function WorksiteSelector({ employeeId, worksiteId, worksites }: Props) {
  const router = useRouter()

  const handleChange = async (newWorksiteId: string) => {
    const result = await updateEmployee(employeeId, { worksiteId: newWorksiteId })
    if (result.success) {
      toast.success('Sede actualizada')
      router.refresh()
    } else {
      toast.error('Error al actualizar sede')
    }
  }

  return (
    <select 
      name="worksite_id"
      defaultValue={worksiteId || ''}
      onChange={(e) => handleChange(e.target.value)}
      className="bg-transparent text-sm font-bold text-white outline-none border-none cursor-pointer focus:ring-0 p-0 w-full"
    >
      <option value="" disabled className="bg-slate-900">Cambiar sede...</option>
      {worksites?.map(w => (
        <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
      ))}
    </select>
  )
}
