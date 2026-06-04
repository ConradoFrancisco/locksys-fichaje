'use client'

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { AttendanceAnalysisModal } from './AttendanceAnalysisModal'

export function AttendanceAnalysisButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-[#0072ff] hover:bg-[#0072ff]/90 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#0072ff]/20"
      >
        <BarChart3 className="h-5 w-5" />
        <span className="hidden sm:inline">Análisis de Asistencias</span>
        <span className="sm:hidden">Análisis</span>
      </button>
      <AttendanceAnalysisModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
