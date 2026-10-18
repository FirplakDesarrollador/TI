'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Search, 
  UserMinus, 
  UserPlus, 
  Edit, 
  FileText, 
  Loader2, 
  Filter, 
  Package,
  ExternalLink,
  MoreVertical,
  X,
  CheckCircle2,
  AlertCircle,
  History,
  User
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { SearchableSelect } from '@/components/SearchableSelect'
import { StatusModal, ModalType } from '@/components/StatusModal'
import DeviceHistoryModal from '@/components/DeviceHistoryModal'

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })

  // Edit Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    assignment: any;
  }>({
    isOpen: false,
    assignment: null
  })

  const [editFormData, setEditFormData] = useState({
    employee_id: '',
    cargo: '',
    notas: '',
    status: 'asignado'
  })

  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    deviceId: 0,
    deviceName: ''
  })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch all products with their history
      const { data: devices, error: devError } = await supabase
        .from('ti_productos')
        .select(`
          id,
          nombre_dispositivo,
          num_serial,
          referencia,
          ti_historial_stock (
            id,
            estado,
            empleado_id,
            created_at,
            Cargo,
            observaciones_tecnicas
          )
        `)

      if (devError) throw devError

      // 2. Fetch all employees for the edit select
      const { data: empData } = await supabase
        .from('empleados')
        .select('id, nombreCompleto, cargo, area')
        .eq('activo', true)
        .order('nombreCompleto')
      
      setEmployees(empData || [])

      // 3. Fetch all PDF records
      const { data: pdfData } = await supabase
        .from('ti_asignaciones_pdf')
        .select('*')
        .order('created_at', { ascending: false })

      // 4. Process assignments: Find devices whose LATEST status is 'asignado'
      const activeAssignments = (devices || []).map((device: any) => {
        const history = device.ti_historial_stock || []
        const latestStatus = [...history].sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        if (latestStatus?.estado === 'asignado' && latestStatus.empleado_id) {
          const employee = empData?.find(e => e.id === latestStatus.empleado_id)
          const pdf = pdfData?.find(p => 
            p.device_id === device.id && 
            p.employee_id === latestStatus.empleado_id
          )

          return {
            device_id: device.id,
            device_name: device.nombre_dispositivo,
            num_serial: device.num_serial,
            referencia: device.referencia,
            employee_id: latestStatus.empleado_id,
            employee_name: employee?.nombreCompleto || 'Desconocido',
            cargo: latestStatus.Cargo || employee?.cargo || 'N/A',
            area: employee?.area || 'N/A',
            fecha_asignacion: latestStatus.created_at,
            observaciones: latestStatus.observaciones_tecnicas,
            pdf_url: pdf?.pdf_url,
            history_id: latestStatus.id
          }
        }
        return null
      }).filter(Boolean)

      setAssignments(activeAssignments)
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'No se pudieron cargar las asignaciones.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUnassign = async (assignment: any) => {
    if (!confirm(`¿Está seguro que desea quitar la asignación de ${assignment.employee_name} para el dispositivo ${assignment.device_name}?`)) {
      return
    }

    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email || 'Sistema'

      const { error } = await supabase
        .from('ti_historial_stock')
        .insert({
          producto_id: assignment.device_id,
          empleado_id: null,
          estado: 'disponible',
          usuario: userEmail,
          observaciones_tecnicas: `Desasignación de ${assignment.employee_name}.`,
          observacion_salvedad: 'Retorno de equipo'
        })

      if (error) throw error

      setModal({
        isOpen: true,
        title: '¡Éxito!',
        message: 'Dispositivo desasignado correctamente.',
        type: 'success'
      })
      fetchData()
    } catch (error) {
      console.error('Error unassigning:', error)
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo realizar la desasignación.',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (assignment: any) => {
    setEditModal({
      isOpen: true,
      assignment
    })
    setEditFormData({
      employee_id: assignment.employee_id.toString(),
      cargo: assignment.cargo,
      notas: assignment.observaciones || '',
      status: 'asignado'
    })
  }

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email || 'Sistema'
      const { assignment } = editModal

      const { error } = await supabase
        .from('ti_historial_stock')
        .insert({
          producto_id: assignment.device_id,
          empleado_id: Number(editFormData.employee_id),
          estado: 'asignado',
          usuario: userEmail,
          Cargo: editFormData.cargo,
          observaciones_tecnicas: editFormData.notas,
          observacion_salvedad: 'Actualización de asignación'
        })

      if (error) throw error

      setEditModal({ isOpen: false, assignment: null })
      setModal({
        isOpen: true,
        title: '¡Actualizado!',
        message: 'La asignación ha sido actualizada con éxito.',
        type: 'success'
      })
      fetchData()
    } catch (error) {
      console.error('Error updating assignment:', error)
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo actualizar la asignación.',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAssignments = assignments.filter(a => 
    a.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.num_serial.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPdfUrl = (path: string) => {
    const { data } = supabase.storage
      .from('actas-pdf-asignacion')
      .getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-2 md:p-4 font-sans text-[#254153]">
      <div className="mx-auto w-full px-2">
        <header className="mb-3">
          <div className="flex items-center gap-3 mb-3">
            <Link 
              href="/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#749094] shadow-sm ring-1 ring-[#749094]/10 transition-all hover:text-[#254153]"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#254153] leading-none">Gestión de Asignaciones</h1>
              <p className="text-[10px] font-medium text-[#749094]">Control y seguimiento de dispositivos entregados</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-[#749094]/10">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#749094]" size={16} />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar colaborador, equipo o serial..."
                className="w-full rounded-lg border border-[#749094]/20 bg-[#F8FAFC] py-2 pl-10 pr-3 text-[12px] transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/inventory/sync-pdfs"
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 transition-all hover:bg-amber-100"
              >
                <FileText size={16} />
                Sincronizar PDFs
              </Link>
              <Link
                href="/dashboard/inventory/assign"
                className="flex items-center gap-2 rounded-lg bg-[#254153] px-4 py-2 text-[11px] font-bold text-white shadow-lg shadow-[#254153]/20 transition-all hover:bg-[#1a2e3b]"
              >
                <UserPlus size={16} />
                Nueva Asignación
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-[#749094]/10 shadow-sm">
            <Loader2 className="animate-spin text-[#254153]" size={48} />
            <p className="text-sm font-bold text-[#749094] animate-pulse">Sincronizando asignaciones...</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#749094]/10 bg-white shadow-xl shadow-[#749094]/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#749094]/10 bg-[#749094]/5 text-[9px] font-black uppercase tracking-wider text-[#749094]">
                    <th className="px-3 py-2">Colaborador / Área</th>
                    <th className="px-2 py-2">Dispositivo</th>
                    <th className="px-2 py-2">Serial / Ref</th>
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2 text-center">PDF</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#749094]/10 text-[12px]">
                  {filteredAssignments.map((assignment, idx) => (
                    <tr key={idx} className="group transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-3 py-1.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#254153] leading-none">{assignment.employee_name}</span>
                          <span className="text-[9px] font-medium text-[#749094] uppercase tracking-tighter truncate max-w-[150px]">{assignment.area} • {assignment.cargo}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#254153]/5 text-[#254153]">
                            <Package size={12} />
                          </div>
                          <span className="font-semibold text-[#254153] leading-none line-clamp-1">{assignment.device_name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col">
                          <span className="font-mono text-[9px] font-bold text-[#254153] leading-none">{assignment.num_serial}</span>
                          <span className="text-[9px] text-[#749094] truncate max-w-[100px] leading-none mt-0.5">{assignment.referencia}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-[#749094] font-medium text-[11px] whitespace-nowrap">
                        {new Date(assignment.fecha_asignacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {assignment.pdf_url ? (
                          <a 
                            href={getPdfUrl(assignment.pdf_url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded bg-rose-50 text-rose-600 transition-all hover:bg-rose-100 shadow-sm"
                            title="Ver Acta"
                          >
                            <FileText size={14} />
                          </a>
                        ) : (
                          <span className="text-[8px] font-bold text-[#749094]/40 italic">N/A</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1 transition-opacity">
                          <button
                            onClick={() => setHistoryModal({
                              isOpen: true,
                              deviceId: assignment.device_id,
                              deviceName: assignment.device_name
                            })}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#254153]/5 text-[#254153] transition-all hover:bg-[#254153]/10"
                            title="Ver Historial"
                          >
                            <History size={12} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(assignment)}
                            className="flex h-7 w-7 items-center justify-center rounded bg-blue-50 text-blue-600 transition-all hover:bg-blue-100"
                            title="Editar"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleUnassign(assignment)}
                            className="flex h-7 w-7 items-center justify-center rounded bg-amber-50 text-amber-600 transition-all hover:bg-amber-100"
                            title="Desasignar"
                          >
                            <UserMinus size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAssignments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#F8FAFC] text-[#749094]/20">
                  <Package size={40} />
                </div>
                <h3 className="text-lg font-bold text-[#254153]">No hay asignaciones activas</h3>
                <p className="max-w-xs text-sm text-[#749094]">
                  {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : 'Todos los dispositivos están disponibles o en reparación.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#749094]/10 px-4 py-2 bg-[#749094]/5 rounded-t-2xl">
              <h2 className="text-sm font-black text-[#254153] uppercase tracking-tight">Editar Asignación</h2>
              <button 
                onClick={() => setEditModal({ isOpen: false, assignment: null })}
                className="text-[#749094] hover:text-[#254153]"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateAssignment} className="p-4 space-y-3">
              <div className="rounded-2xl bg-[#254153]/5 p-4 flex items-center gap-4 border border-[#254153]/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-[#254153]">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#749094]">Dispositivo Seleccionado</p>
                  <p className="font-bold text-[#254153]">{editModal.assignment.device_name}</p>
                  <p className="text-xs font-mono text-[#749094]">{editModal.assignment.num_serial}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#749094] uppercase tracking-tighter">Persona Asignada</label>
                <SearchableSelect
                  options={employees.map(e => ({ id: e.id, label: e.nombreCompleto, sublabel: e.cargo }))}
                  value={editFormData.employee_id}
                  onChange={(val) => {
                    const emp = employees.find(e => e.id === Number(val))
                    setEditFormData(prev => ({ 
                      ...prev, 
                      employee_id: val.toString(),
                      cargo: emp?.cargo || prev.cargo
                    }))
                  }}
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#F8FAFC] px-3 py-1.5 text-[12px] text-[#254153] focus:border-[#254153]/30 focus:bg-white focus:outline-none"
                  placeholder="Seleccione colaborador..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#749094] uppercase tracking-tighter">Cargo</label>
                <input
                  type="text"
                  value={editFormData.cargo}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, cargo: e.target.value }))}
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#F8FAFC] px-3 py-1.5 text-[12px] text-[#254153] focus:border-[#254153]/30 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#749094] uppercase tracking-tighter">Observaciones</label>
                <textarea
                  rows={2}
                  value={editFormData.notas}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Motivo del cambio..."
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#F8FAFC] px-3 py-1.5 text-[12px] text-[#254153] placeholder:text-[#749094]/50 focus:border-[#254153]/30 focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, assignment: null })}
                  className="flex-1 rounded-lg border border-[#749094]/20 px-4 py-2 text-[11px] font-bold text-[#749094] transition-all hover:bg-[#F8FAFC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-[#254153] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#254153]/20 transition-all hover:bg-[#1a2e3b] disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* History Modal */}
      <DeviceHistoryModal 
        deviceId={historyModal.deviceId}
        deviceName={historyModal.deviceName}
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
      />

      {/* Status Modal */}
      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  )
}
