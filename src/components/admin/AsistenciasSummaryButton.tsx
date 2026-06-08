'use client'

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { AttendanceSummaryModal } from './AttendanceSummaryModal'

export function AsistenciasSummaryButton({ tenantId }: { tenantId: string }) {
  const [showSummary, setShowSummary] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowSummary(true)}
        className="flex items-center gap-2 bg-[#0072ff] hover:bg-[#0062dd] text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
        title="Ver resumen mensual"
      >
        <BarChart3 className="w-5 h-5" />
        <span className="hidden sm:inline">Reporte Mensual</span>
      </button>
      <AttendanceSummaryModal 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)} 
        tenantId={tenantId}
      />
    </>
  )
}
