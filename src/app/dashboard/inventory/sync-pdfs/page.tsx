'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  ShieldCheck,
  Package,
  User
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { generateAssignmentPDF } from '@/lib/pdf-utils'

export default function SyncPdfsPage() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    missing: 0,
    completed: 0,
    failed: 0
  })
  const [logs, setLogs] = useState<string[]>([])
  const [missingAssignments, setMissingAssignments] = useState<any[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    fetchMissingAssignments()
  }, [])

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50))
  }

  const fetchMissingAssignments = async () => {
    setLoading(true)
    addLog('Buscando asignaciones históricas sin acta PDF...')
    try {
      // 1. Fetch all history records with a signature
      const { data: history, error: historyError } = await supabase
        .from('ti_historial_stock')
        .select(`
          id,
          producto_id,
          empleado_id,
          firma,
          created_at,
          Cargo,
          estado,
          observaciones_tecnicas,
          ti_productos (
            nombre_dispositivo,
            num_serial,
            referencia,
            detalle_producto
          )
        `)
        .not('firma', 'is', null)

      if (historyError) throw historyError

      // 2. Fetch employees for full names
      const { data: employees } = await supabase
        .from('empleados')
        .select('id, nombreCompleto, cargo, area')

      // 3. Fetch existing PDFs to compare by historial_id
      const { data: existingPdfs } = await supabase
        .from('ti_asignaciones_pdf')
        .select('historial_id')

      // 4. Identify missing
      const missing = (history || []).filter((h: any) => {
        // Un registro está pendiente si tiene firma pero su ID no está en ti_asignaciones_pdf.historial_id
        return !existingPdfs?.some(p => p.historial_id === h.id)
      }).map((h: any) => {
        const emp = employees?.find(e => e.id === h.empleado_id)
        return {
          ...h,
          employee: emp
        }
      }).filter(h => h.employee) // Only if we found the employee

      setMissingAssignments(missing)
      setStats({
        total: history?.length || 0,
        missing: missing.length,
        completed: 0,
        failed: 0
      })
      addLog(`Se encontraron ${missing.length} actas pendientes de un historial de ${history?.length || 0}.`)
    } catch (error) {
      console.error('Error fetching data:', error)
      addLog('❌ Error al cargar datos iniciales.')
    } finally {
      setLoading(false)
    }
  }

  const cleanString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ñ/g, "n")
      .replace(/Ñ/g, "N")
      .replace(/[^a-zA-Z0-9_\-\.]/g, "_")
  }

  const handleStartSync = async () => {
    if (missingAssignments.length === 0) return
    
    setProcessing(true)
    setStats(prev => ({ ...prev, completed: 0, failed: 0 }))
    addLog('Iniciando generación masiva de PDFs vinculados al historial...')

    for (const item of missingAssignments) {
      try {
        const empName = item.employee?.nombreCompleto || 'Desconocido'
        const devName = item.ti_productos?.nombre_dispositivo || 'Equipo'
        addLog(`Procesando acta para: ${empName} (${item.created_at.split('T')[0]})`)
        
        // 1. Generate PDF
        const pdfBuffer = await generateAssignmentPDF({
          employeeName: empName,
          employeeId: item.empleado_id?.toString() || '0',
          employeeCargo: item.Cargo || item.employee?.cargo || 'N/A',
          employeeArea: item.employee?.area || 'N/A',
          deviceName: devName,
          deviceSerial: item.ti_productos?.num_serial || 'N/A',
          deviceCategory: item.ti_productos?.referencia || 'N/A',
          deviceObservation: item.ti_productos?.detalle_producto || 'N/A',
          assignmentDate: item.created_at.split('T')[0],
          notes: item.observaciones_tecnicas || '',
          signature: item.firma
        })

        // 2. Upload to Storage
        const employeeNameClean = cleanString(empName)
        const fileName = `Acta_Historial_${item.id}_${employeeNameClean}.pdf`
        const filePath = `${item.empleado_id}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('actas-pdf-asignacion')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          })

        if (uploadError) throw uploadError

        // 3. Register in Database with history link
        const { error: dbError } = await supabase
          .from('ti_asignaciones_pdf')
          .insert({
            employee_id: item.empleado_id,
            device_id: item.producto_id,
            pdf_url: uploadData.path,
            employee_name: empName,
            device_name: devName,
            num_serial: item.ti_productos?.num_serial,
            firma: item.firma,
            historial_id: item.id
          })

        if (dbError) throw dbError

        setStats(prev => ({ ...prev, completed: prev.completed + 1 }))
        addLog(`✅ Éxito: Acta #${item.id} generada.`)
      } catch (error) {
        console.error(`Error processing ${item.id}:`, error)
        setStats(prev => ({ ...prev, failed: prev.failed + 1 }))
        addLog(`❌ Falló registro #${item.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    setProcessing(false)
    addLog('Sincronización finalizada.')
    fetchMissingAssignments()
  }

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-[#254153]">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/inventory/assignments"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#749094] shadow-sm ring-1 ring-[#749094]/20 transition-all hover:text-[#254153] hover:ring-[#749094]/40"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-[#254153]">Sincronización de Actas Históricas</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-3xl border border-[#749094]/10 bg-[#749094]/5 p-6 text-center">
            <p className="text-xs font-bold text-[#749094] uppercase tracking-wider mb-1">Registros Firmados</p>
            <p className="text-3xl font-black text-[#254153]">{stats.total}</p>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 text-center">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Actas Pendientes</p>
            <p className="text-3xl font-black text-amber-700">{stats.missing}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-center">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Completados</p>
            <p className="text-3xl font-black text-emerald-700">{stats.completed}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#749094]/10 bg-white shadow-xl shadow-[#749094]/5">
          <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#254153]">Sincronización Inteligente</h2>
                <p className="text-sm text-[#749094]">Se generará un PDF por cada evento histórico que contenga una firma.</p>
              </div>
              <button
                onClick={handleStartSync}
                disabled={loading || processing || stats.missing === 0}
                className="flex items-center gap-2 rounded-xl bg-[#254153] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#254153]/20 transition-all hover:bg-[#1a2e3b] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                {processing ? 'Generando...' : 'Iniciar Sincronización'}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#749094] uppercase tracking-wider mb-2">
                <ShieldCheck size={14} />
                Log de Procesamiento
              </div>
              <div className="h-64 overflow-y-auto rounded-2xl border border-[#749094]/10 bg-[#F8FAFC] p-4 font-mono text-[11px] space-y-1">
                {logs.length === 0 && <p className="text-[#749094]/40 italic">Esperando inicio de proceso...</p>}
                {logs.map((log, i) => (
                  <div key={i} className="border-b border-[#749094]/5 pb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
