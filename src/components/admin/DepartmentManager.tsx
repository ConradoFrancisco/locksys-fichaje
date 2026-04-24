'use client'

import { useState } from 'react'
import { createDepartment, deleteDepartment } from '@/lib/actions/departments'
import { Plus, Trash2, Tag, LayoutGrid } from 'lucide-react'

export function DepartmentManager({ departments }: { departments: any[] }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name) return
    setLoading(true)
    await createDepartment(name)
    setName('')
    setLoading(false)
  }

  return (
    <div className="locksys-card p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-white">Áreas / Sectores</h2>
      </div>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Docencia"
          className="flex-1 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-all"
        />
        <button 
          onClick={handleCreate}
          disabled={loading}
          className="bg-indigo-600 p-2 rounded-xl text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {departments.map((dept) => (
          <div key={dept.id} className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl group transition-all hover:border-indigo-500/30">
            <Tag className="h-3 w-3 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300">{dept.name}</span>
            <button 
              onClick={() => deleteDepartment(dept.id)}
              className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {departments.length === 0 && (
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">No hay áreas creadas</p>
        )}
      </div>
    </div>
  )
}
