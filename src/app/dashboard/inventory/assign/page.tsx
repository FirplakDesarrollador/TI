'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, FileText, Loader2, UserCheck, Package, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { SignaturePadComponent } from '@/components/SignaturePad'
import { generateAssignmentPDF } from '@/lib/pdf-utils'
import { SearchableSelect } from '@/components/SearchableSelect'
import { StatusModal, ModalType } from '@/components/StatusModal'

export default function AssignDevice() {
  const searchParams = useSearchParams()
  const initialDeviceId = searchParams.get('device_id')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
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
  
  const [formData, setFormData] = useState({
    employee_id: '',
    device_id: initialDeviceId || '',
    cargo: '',
    area: '',
    fecha_asignacion: new Date().toISOString().split('T')[0],
    notas: '',
    signature: ''
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch employees - Using schema 'thti' as requested
        // If 'thti' is not a schema but just a prefix, adjust accordingly.
        // We'll try public.empleados first if thti schema fails or is unknown.
        const { data: empData, error: empError } = await supabase
          .from('empleados')
          .select('id, nombreCompleto, cargo, area')
          .eq('activo', true)
          .order('nombreCompleto')

        if (empError) console.warn('Error fetching empleados:', empError)
        setEmployees(empData || [])

        const { data: devData, error: devError } = await supabase
          .from('ti_productos')
          .select(`
            id, 
            nombre_dispositivo, 
            num_serial, 
            referencia, 
            detalle_producto,
            ti_historial_stock (
              estado,
              created_at
            )
          `)
          .order('nombre_dispositivo')

        if (devError) throw devError
        
        // Map devices to include their current status for easy checking
        const mappedDevices = (devData || []).map((p: any) => {
          const latestHistory = p.ti_historial_stock?.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          return {
            ...p,
            currentStatus: latestHistory?.estado || 'disponible'
          }
        })

        // Filter: Only unassigned OR the one we specifically requested
        const filteredDevices = mappedDevices.filter((p: any) => {
          if (initialDeviceId && p.id.toString() === initialDeviceId) return true
          return p.currentStatus === 'disponible'
        })

        setDevices(filteredDevices)

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto-fill cargo/area if employee selected
    if (name === 'employee_id') {
      const emp = employees.find(e => e.id === Number(value))
      if (emp) {
        setFormData(prev => ({ 
          ...prev, 
          employee_id: value,
          cargo: emp.cargo || prev.cargo,
          area: emp.area || prev.area
        }))
      }
    }
  }

  const handleSignatureSave = useCallback((data: string) => {
    setFormData(prev => ({ ...prev, signature: data }))
  }, [])

  const handleSignatureClear = useCallback(() => {
    setFormData(prev => ({ ...prev, signature: '' }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get current user email for history record
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email || 'sistema@nexus.com'

    if (!formData.employee_id) {
      setModal({
        isOpen: true,
        title: 'Información Faltante',
        message: 'Por favor seleccione la PERSONA a la que se asignará el dispositivo.',
        type: 'warning'
      })
      return
    }
    if (!formData.device_id) {
      setModal({
        isOpen: true,
        title: 'Información Faltante',
        message: 'Por favor seleccione el DISPOSITIVO que desea asignar.',
        type: 'warning'
      })
      return
    }
    if (!formData.signature) {
      setModal({
        isOpen: true,
        title: 'Firma Requerida',
        message: 'Por favor capture la FIRMA del colaborador antes de generar el acta.',
        type: 'warning'
      })
      return
    }

    const selectedEmployee = employees.find(e => e.id.toString() === formData.employee_id.toString())
    const selectedDevice = devices.find(d => d.id.toString() === formData.device_id.toString())
    
    console.log('Submitting assignment:', { formData, selectedEmployee, selectedDevice })

    setSubmitting(true)
    try {
      // 0. Get user session
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email || 'Sistema'

      // 1. Update device status in ti_productos? (Maybe historical stock)
      // For now, we just generate the PDF as requested.
      
      // 2. Generate PDF
      const pdfBuffer = await generateAssignmentPDF({
        employeeName: selectedEmployee?.nombreCompleto || 'N/A',
        employeeId: selectedEmployee?.id?.toString() || 'N/A',
        employeeCargo: formData.cargo,
        employeeArea: formData.area,
        deviceName: selectedDevice?.nombre_dispositivo || 'N/A',
        deviceSerial: selectedDevice?.num_serial || 'N/A',
        deviceCategory: selectedDevice?.referencia || 'N/A',
        deviceObservation: selectedDevice?.detalle_producto || 'Sin observaciones técnicas.',
        assignmentDate: formData.fecha_asignacion,
        notes: formData.notas,
        signature: formData.signature
      })

      // 3. Upload to Supabase Storage
      const employeeNameClean = (selectedEmployee?.nombreCompleto || 'Desconocido').replace(/\s+/g, '_')
      const deviceSerialClean = selectedDevice?.num_serial || Date.now().toString()
      const fileName = `Acta_Entrega_${deviceSerialClean}_${employeeNameClean}.pdf`
      const filePath = `${formData.employee_id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('actas-pdf-asignacion')
        .upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) throw uploadError

      // 4. Update device history FIRST to get the history ID
      const { data: historyData, error: historyError } = await supabase
        .from('ti_historial_stock')
        .insert({
          producto_id: formData.device_id,
          empleado_id: formData.employee_id,
          estado: 'asignado',
          usuario: userEmail,
          firma: formData.signature,
          observaciones_tecnicas: 'Asignación automática desde acta de entrega',
          observacion_salvedad: 'Sin salvedades - Proceso automático',
          Cargo: formData.cargo
        })
        .select('id')
        .single()

      if (historyError) throw historyError

      // 5. Record in Database linking to history
      const { error: dbError } = await supabase
        .from('ti_asignaciones_pdf')
        .insert({
          employee_id: formData.employee_id,
          device_id: formData.device_id,
          pdf_url: uploadData.path,
          employee_name: selectedEmployee?.nombreCompleto,
          device_name: selectedDevice?.nombre_dispositivo,
          num_serial: selectedDevice?.num_serial,
          firma: formData.signature,
          historial_id: historyData.id
        })

      if (dbError) throw dbError

      // 5. Automatic Download (Client side)
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)

      setModal({
        isOpen: true,
        title: '¡Éxito!',
        message: 'Acta generada, guardada y descargada con éxito.',
        type: 'success'
      })
      
    } catch (error) {
      console.error('Error in assignment:', error)
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Ocurrió un error al generar el acta o conectar con la base de datos.',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-[#254153]">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#749094] shadow-sm ring-1 ring-[#749094]/20 transition-all hover:text-[#254153] hover:ring-[#749094]/40"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-[#254153]">Asignar Dispositivo</h1>
          </div>
        </header>

        <div className="overflow-hidden rounded-3xl border border-[#749094]/10 bg-white shadow-xl shadow-[#749094]/5">
          <div className="border-b border-[#749094]/5 bg-[#749094]/5 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#254153]">
              <UserCheck size={24} />
              <span className="font-bold">Nueva Asignación</span>
            </div>
            <div className="text-xs font-semibold text-[#749094] uppercase tracking-wider">
              {formData.fecha_asignacion}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#254153]" size={40} />
                <p className="text-sm font-medium text-[#749094]">Cargando datos...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Persona */}
                  <SearchableSelect
                    label="Persona"
                    required
                    placeholder="Seleccione una persona..."
                    options={employees.map(emp => ({
                      id: emp.id,
                      label: emp.nombreCompleto,
                      sublabel: emp.cargo
                    }))}
                    value={formData.employee_id}
                    onChange={(val) => {
                      const emp = employees.find(e => e.id === Number(val))
                      setFormData(prev => ({ 
                        ...prev, 
                        employee_id: val.toString(),
                        cargo: emp?.cargo || prev.cargo,
                        area: emp?.area || prev.area
                      }))
                    }}
                  />

                  {/* Dispositivo */}
                  <div className="space-y-4">
                    <SearchableSelect
                      label="Dispositivo"
                      required
                      placeholder="Seleccione un dispositivo..."
                      options={devices.map(dev => ({
                        id: dev.id,
                        label: dev.nombre_dispositivo,
                        sublabel: dev.num_serial || 'Sin Serial'
                      }))}
                      value={formData.device_id}
                      onChange={(val) => {
                        const selected = devices.find(d => d.id.toString() === val.toString())
                        if (selected?.currentStatus === 'asignado') {
                          const confirmTransfer = window.confirm(
                            `Este dispositivo ya está ASIGNADO a otra persona. \n\n¿Deseas quitarle la asignación actual y proceder con la nueva entrega? \n\n(Se mantendrá el registro histórico de ambos eventos)`
                          )
                          if (!confirmTransfer) return
                        }
                        setFormData(prev => ({ ...prev, device_id: val.toString() }))
                      }}
                    />
                    
                    {formData.device_id && (
                      <div className="rounded-xl border border-[#749094]/10 bg-[#749094]/5 p-4 space-y-2 animate-in fade-in slide-in-from-top-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#749094]">Serial:</span>
                          <span className="font-bold text-[#254153]">
                            {devices.find(d => d.id.toString() === formData.device_id)?.num_serial || 'No registrado'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#749094]">Referencia:</span>
                          <span className="text-[#254153]">
                            {devices.find(d => d.id.toString() === formData.device_id)?.referencia || 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cargo */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#749094]">Cargo</label>
                    <input 
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                      type="text" 
                      placeholder="Ej. Ejecutivo de Cuentas"
                      className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                    />
                  </div>

                  {/* Área */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#749094]">Área</label>
                    <input 
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      type="text" 
                      placeholder="Ej. Comercial"
                      className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                    />
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#749094]">Notas / Observaciones</label>
                  <textarea 
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Detalles sobre el estado del equipo o condiciones de entrega..."
                    className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                  ></textarea>
                </div>

                {/* Firma */}
                <SignaturePadComponent 
                  onSave={handleSignatureSave} 
                  onClear={handleSignatureClear} 
                />

                <div className="pt-6 border-t border-[#749094]/10">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#254153] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#254153]/20 transition-all hover:bg-[#1a2e3b] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                    {submitting ? 'Generando acta...' : 'Generar Acta de Asignación (PDF)'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Modal for all notifications - Moved outside form */}
        <StatusModal 
          isOpen={modal.isOpen}
          onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />
      </div>
    </div>
  )
}
