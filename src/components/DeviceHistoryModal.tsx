'use client'

import { useState, useEffect } from 'react'
import { X, History, User, Calendar, Info, CheckCircle2, RotateCcw, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface HistoryEntry {
  id: number
  created_at: string
  estado: string
  Cargo: string
  observaciones_tecnicas: string
  employee: {
    nombreCompleto: string
  } | null
  pdf?: {
    pdf_url: string
  }
}

export default function DeviceHistoryModal({ 
  deviceId, 
  deviceName, 
  isOpen, 
  onClose 
}: { 
  deviceId: number
  deviceName: string
  isOpen: boolean
  onClose: () => void
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && deviceId) {
      fetchHistory()
    }
  }, [isOpen, deviceId])

  const getPdfUrl = (path: string) => {
    const { data } = supabase.storage
      .from('actas-pdf-asignacion')
      .getPublicUrl(path)
    return data.publicUrl
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      // 1. Fetch history
      const { data: historyData, error: historyError } = await supabase
        .from('ti_historial_stock')
        .select(`
          id,
          created_at,
          estado,
          Cargo,
          observaciones_tecnicas,
          employee:empleado_id (
            nombreCompleto
          )
        `)
        .eq('producto_id', deviceId)
        .order('created_at', { ascending: false })

      if (historyError) throw historyError

      // 2. Fetch associated PDFs
      const { data: pdfs, error: pdfError } = await supabase
        .from('ti_asignaciones_pdf')
        .select('historial_id, pdf_url')
        .eq('device_id', deviceId)

      // 3. Combine
      const combined = (historyData || []).map((entry: any) => ({
        ...entry,
        employee: Array.isArray(entry.employee) ? entry.employee[0] : entry.employee,
        pdf: pdfs?.find(p => p.historial_id === entry.id)
      }))

      setHistory(combined)
    } catch (error: any) {
      console.error('Error fetching history:', error)
      alert(`Error al cargar historial: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#254153]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#749094]/10">
        <div className="flex items-center justify-between border-b border-[#749094]/10 bg-[#749094]/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#254153] text-white shadow-lg">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#254153]">Historial de Asignaciones</h2>
              <p className="text-xs text-[#749094] font-medium">{deviceName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-[#749094] hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#254153]/10 border-t-[#254153]"></div>
              <p className="text-sm text-[#749094] font-medium">Cargando historial...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-[#749094]/5 p-4">
                <Info size={32} className="text-[#749094]/30" />
              </div>
              <p className="text-[#749094] font-medium">No hay registros de historial para este dispositivo.</p>
            </div>
          ) : (
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#254153]/20 before:via-[#254153]/10 before:to-transparent">
              {history.map((entry) => (
                <div key={entry.id} className="relative pl-12 group">
                  {/* Dot */}
                  <div className={`absolute left-0 mt-1.5 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-110 ${
                    entry.estado?.toLowerCase() === 'asignado'
                      ? 'bg-blue-500 text-white' 
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {entry.estado?.toLowerCase() === 'asignado' ? <User size={16} /> : <RotateCcw size={16} />}
                  </div>

                  <div className="rounded-xl border border-[#749094]/10 bg-white p-4 shadow-sm transition-all hover:border-[#254153]/20 hover:shadow-md">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        entry.estado?.toLowerCase() === 'asignado'
                          ? 'bg-blue-50 text-blue-600' 
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {entry.estado?.toLowerCase() === 'asignado' ? <CheckCircle2 size={10} /> : <RotateCcw size={10} />}
                        {entry.estado}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[#749094]">
                        <Calendar size={12} />
                        {new Date(entry.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#254153]">
                            {entry.employee?.nombreCompleto || 'Sin empleado'}
                          </p>
                          {entry.Cargo && (
                            <span className="text-[10px] text-[#749094] border-l border-[#749094]/30 pl-2">
                              {entry.Cargo}
                            </span>
                          )}
                        </div>
                        
                        {entry.pdf && (
                          <a 
                            href={getPdfUrl(entry.pdf.pdf_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-all hover:bg-rose-100 hover:scale-110 active:scale-95"
                            title="Ver Acta Original"
                          >
                            <FileText size={16} />
                          </a>
                        )}
                      </div>
                      
                      {entry.observaciones_tecnicas && (
                        <p className="text-xs italic text-[#749094] bg-[#749094]/5 p-2 rounded-lg leading-relaxed">
                          "{entry.observaciones_tecnicas}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#749094]/10 bg-[#749094]/5 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#254153] py-2.5 text-sm font-bold text-white shadow-lg shadow-[#254153]/20 hover:bg-[#1a2e3b] transition-all active:scale-[0.98]"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  )
}
