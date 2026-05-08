'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  PlusCircle, 
  Loader2, 
  Monitor, 
  UserCheck, 
  Hash, 
  Building2, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Mail,
  Calendar,
  Laptop2,
  Search
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { createClient as createExternalClient } from '@supabase/supabase-js'
import { SearchableSelect } from '@/components/SearchableSelect'
import { LogoFPK } from '@/components/LogoFPK'

// External database for Cost Centers (Visitantes y Proveedores)
const otherSupabase = createExternalClient(
  'https://zohdtksgxhbheaftgmsi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaGR0a3NneGhiaGVhZnRnbXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI5NjExNTEsImV4cCI6MjAzODUzNzE1MX0.Euu6FTh11mbh4lUmhKFMTFYZ9hWgZ-RzECcUYKGRYQE'
)

export default function PublicRequestDevicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Data for dropdowns
  const [devices, setDevices] = useState<string[]>([])
  const [jefes, setJefes] = useState<{name: string, email: string}[]>([])
  const [employees, setEmployees] = useState<{name: string, email: string}[]>([])
  const [costCenters, setCostCenters] = useState<{id: string, label: string}[]>([])
  const [accounts, setAccounts] = useState<{id: string, label: string}[]>([])

  // Form state
  const [formData, setFormData] = useState({
    email_solicitante: '',
    nombre_solicitante: '',
    dispositivo: '',
    otro_dispositivo: '',
    cantidad: 1,
    centro_costos: '',
    cuenta_contable: '',
    jefe_aprobador: '',
    email_jefe: '',
    comentario: ''
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()

      try {
        // Fetch categories
        const { data: categoryData } = await supabase
          .from('ti_categorias_productos')
          .select('categoria')
          .order('categoria')
        
        const uniqueCategories = Array.from(new Set((categoryData || []).map(c => c.categoria.trim())))
        const filteredCategories = uniqueCategories.filter(c => c.toLowerCase() !== 'otro')
        setDevices([...filteredCategories, 'Otro'])

        // Fetch jefes with email mapping
        const { data: jefesData } = await supabase
          .from('view_jefes_con_correo')
          .select('jefe_nombre, jefe_correo')
          .order('jefe_nombre')
        
        setJefes((jefesData || []).map(j => ({
          name: j.jefe_nombre,
          email: j.jefe_correo || ''
        })))

        // Fetch employees for the solicitor dropdown
        const { data: employeeData } = await supabase
          .from('empleados')
          .select('nombreCompleto, correo_electronico')
          .eq('activo', true)
          .order('nombreCompleto')
        
        setEmployees((employeeData || []).map(e => ({
          name: e.nombreCompleto?.trim() || 'Sin Nombre',
          email: e.correo_electronico || ''
        })))

        // Fetch cost centers from external database (Visitantes y Proveedores)
        const { data: ccData } = await otherSupabase
          .from('Centro_costos')
          .select('codigo, Título')
          .order('codigo')
        
        if (ccData) {
          setCostCenters(ccData.map(cc => ({
            id: cc.codigo,
            label: `${cc.codigo} - ${cc.Título || ''}`
          })))
        }

        // Fetch accounts from external database (Visitantes y Proveedores)
        const { data: accountsData } = await otherSupabase
          .from('cuentas')
          .select('Título')
          .order('Título')
        
        if (accountsData) {
          setAccounts(accountsData.map(acc => ({
            id: acc.Título,
            label: acc.Título
          })))
        }

      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { data, error: insertError } = await supabase
        .from('ti_solicitudes_dispositivos')
        .insert([{
          email_solicitante: formData.email_solicitante,
          nombre_solicitante: formData.nombre_solicitante,
          dispositivo: formData.dispositivo === 'Otro' ? formData.otro_dispositivo : formData.dispositivo,
          cantidad: formData.cantidad,
          centro_costos: formData.centro_costos,
          cuenta_contable: formData.cuenta_contable,
          jefe_aprobador: formData.jefe_aprobador,
          email_jefe: formData.email_jefe,
          comentario: formData.comentario,
          estado: 'Pendiente'
        }])
        .select('ticket_number')
        .single()

      if (insertError) throw insertError

      setSuccess(data?.ticket_number || 'REGISTRADA')
    } catch (err: any) {
      console.error('Error submitting request:', err)
      // Log full error for debugging in console
      if (err.details || err.hint || err.code) {
        console.error('Detailed error:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code
        })
      }
      setError(err.message || 'Error al enviar la solicitud. Por favor intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#254153]" />
          <p className="text-sm font-medium text-[#749094]">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in duration-500">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-200/50">
            <CheckCircle2 size={56} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-[#254153]">¡Solicitud Enviada!</h2>
            <p className="text-[#749094] text-lg font-medium">
              Tu requerimiento ha sido registrado con el ID:
            </p>
            <div className="bg-[#254153] text-white py-4 px-8 rounded-3xl text-3xl font-black tracking-widest shadow-2xl shadow-[#254153]/30 inline-block mx-auto">
              {success}
            </div>
            <p className="text-[#749094] pt-4">
              Guarda este número para realizar el seguimiento de tu equipo.
            </p>
          </div>
          <div className="pt-8">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 rounded-2xl bg-white border border-[#254153]/10 text-[#254153] font-bold transition-all hover:bg-[#254153]/5 active:scale-95 shadow-sm"
            >
              Hacer otra solicitud
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-white rounded-3xl shadow-xl shadow-[#254153]/5 border border-[#749094]/10">
            <LogoFPK size="lg" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-[#254153] tracking-tight">Solicitud de Dispositivos</h1>
            <p className="text-[#749094] max-w-sm mx-auto mb-4">Solicita equipos y periféricos de TI de forma rápida y sencilla.</p>
            <Link 
              href="/public/inventory/track"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#254153]/5 text-[#254153] text-sm font-bold transition-all hover:bg-[#254153]/10 active:scale-95 border border-[#254153]/5"
            >
              <Search size={16} />
              ¿Ya tienes un ID? Sigue tu solicitud aquí
            </Link>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#254153]/5 border border-[#749094]/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="p-8 sm:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-600 border border-rose-100 animate-in shake duration-500">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-8">
                {/* Solicitor Section */}
                <SearchableSelect
                  label="Nombre del Solicitante"
                  icon={<UserCheck size={16} />}
                  placeholder="Busca tu nombre..."
                  required
                  className="w-full flex items-center justify-between rounded-2xl border border-[#749094]/20 bg-slate-50 px-5 py-4 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                  options={employees.map(emp => ({
                    id: emp.name,
                    label: emp.name
                  }))}
                  value={formData.nombre_solicitante}
                  onChange={(val) => {
                    const selected = employees.find(e => e.name === val)
                    setFormData({ 
                      ...formData, 
                      nombre_solicitante: val.toString(),
                      email_solicitante: selected?.email || '' 
                    })
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Dispositivo */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-black text-[#254153] uppercase tracking-wider">
                      <Monitor size={16} className="text-[#749094]" />
                      Categoría <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.dispositivo}
                      onChange={(e) => setFormData({ ...formData, dispositivo: e.target.value })}
                      className="w-full rounded-2xl border border-[#749094]/20 bg-slate-50 px-5 py-4 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5 appearance-none"
                    >
                      <option value="">Selecciona...</option>
                      {devices.map(device => (
                        <option key={device} value={device}>{device}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-black text-[#254153] uppercase tracking-wider">
                      <Hash size={16} className="text-[#749094]" />
                      Cantidad <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-2xl border border-[#749094]/20 bg-slate-50 px-5 py-4 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                    />
                  </div>
                </div>

                {/* Condicional para "Otro" */}
                {formData.dispositivo === 'Otro' && (
                  <div className="space-y-2 animate-in slide-in-from-top-4 duration-500">
                    <label className="flex items-center gap-2 text-sm font-black text-[#254153] uppercase tracking-wider">
                      <PlusCircle size={16} className="text-[#749094]" />
                      ¿Cuál dispositivo? <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.otro_dispositivo}
                      onChange={(e) => setFormData({ ...formData, otro_dispositivo: e.target.value })}
                      className="w-full rounded-2xl border border-[#749094]/20 bg-slate-50 px-5 py-4 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                      placeholder="Especifica el equipo..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Centro de Costos */}
                  <SearchableSelect
                    label="Centro Costos"
                    icon={<Building2 size={16} />}
                    placeholder="Busca el centro..."
                    required
                    className="w-full flex items-center justify-between rounded-2xl border border-[#749094]/20 bg-slate-50 px-5 py-4 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                    options={costCenters}
                    value={formData.centro_costos}
                    onChange={(val) => setFormData({ ...formData, centro_costos: val.toString() })}
                  />

                  {/* Cuenta Contable */}
                  <SearchableSelect
                    label="Cta Contable"
                    icon={<Hash size={16} />}
                    placeholder="Busca la cuenta..."
                    required
                    className="w-full flex items-center justify-between rounded-2xl border border-[#749094]/20 bg-slate-50 px-5 py-4 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                    options={accounts}
                    value={formData.cuenta_contable}
                    onChange={(val) => setFormData({ ...formData, cuenta_contable: val.toString() })}
                  />
                </div>

                {/* Jefe Aprobador */}
                <SearchableSelect
                  label="Jefe que Aprobará"
                  icon={<UserCheck size={16} />}
                  placeholder="Busca al jefe responsable..."
                  required
                  className="w-full flex items-center justify-between rounded-2xl border border-[#749094]/20 bg-slate-50 px-5 py-4 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                  options={jefes.map(jefe => ({
                    id: jefe.name,
                    label: jefe.email ? `${jefe.name} (${jefe.email})` : jefe.name
                  }))}
                  value={formData.jefe_aprobador}
                  onChange={(val) => {
                    const selected = jefes.find(j => j.name === val)
                    setFormData({ 
                      ...formData, 
                      jefe_aprobador: val.toString(),
                      email_jefe: selected?.email || ''
                    })
                  }}
                />

                {/* Comentario */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-[#254153] uppercase tracking-wider">
                    <MessageSquare size={16} className="text-[#749094]" />
                    Justificación / Comentarios
                  </label>
                  <textarea
                    rows={4}
                    value={formData.comentario}
                    onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                    className="w-full rounded-2xl border border-[#749094]/20 bg-slate-50 px-5 py-4 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5 resize-none"
                    placeholder="Describe por qué necesitas este equipo..."
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full overflow-hidden rounded-[1.5rem] bg-[#254153] py-5 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-[#254153]/20 transition-all hover:scale-[1.01] hover:bg-[#1a2e3b] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Laptop2 size={20} />
                        Enviar Solicitud
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-[#749094] font-medium tracking-wide">
          SISTEMA DE GESTIÓN TI - FIRPLAK S.A. 2026
        </p>
      </div>
    </div>
  )
}
