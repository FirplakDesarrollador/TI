'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusCircle, 
  Loader2, 
  ArrowLeft, 
  Monitor, 
  UserCheck, 
  Hash, 
  Building2, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Mail,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { SearchableSelect } from '@/components/SearchableSelect'

export default function RequestDevicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data for dropdowns
  const [devices, setDevices] = useState<string[]>([])
  const [jefes, setJefes] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    dispositivo: '',
    otro_dispositivo: '',
    cantidad: 1,
    centro_costos: '',
    cuenta_contable: '',
    jefe_aprobador: '',
    comentario: ''
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()

      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      // Fetch categories
      const { data: categoryData } = await supabase
        .from('ti_categorias_productos')
        .select('categoria')
        .order('categoria')
      
      const uniqueCategories = Array.from(new Set((categoryData || []).map(c => c.categoria.trim())))
      const filteredCategories = uniqueCategories.filter(c => c.toLowerCase() !== 'otro')
      setDevices([...filteredCategories, 'Otro'])

      // Fetch jefes
      const { data: jefesData } = await supabase
        .from('view_jefes')
        .select('jefe')
        .order('jefe')
      
      setJefes((jefesData || []).map(j => j.jefe))
      
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { error: insertError } = await supabase
        .from('ti_solicitudes_dispositivos')
        .insert([{
          user_id: user.id,
          email_solicitante: user.email,
          dispositivo: formData.dispositivo === 'Otro' ? formData.otro_dispositivo : formData.dispositivo,
          cantidad: formData.cantidad,
          centro_costos: formData.centro_costos,
          cuenta_contable: formData.cuenta_contable,
          jefe_aprobador: formData.jefe_aprobador,
          comentario: formData.comentario,
          estado: 'Pendiente'
        }])

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      console.error('Error submitting request:', err)
      setError(err.message || 'Error al enviar la solicitud. Por favor intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#254153]" />
          <p className="text-sm font-medium text-[#749094]">Cargando datos del formulario...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in duration-500">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-[#254153]">¡Solicitud Enviada!</h2>
            <p className="text-[#749094]">
              Tu solicitud ha sido registrada correctamente. Redirigiéndote al menú principal...
            </p>
          </div>
          <div className="pt-4">
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-[3000ms] w-full" style={{ transitionTimingFunction: 'linear' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#749094]/10 bg-white/80 px-8 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#749094]/10 text-[#749094] transition-all hover:bg-[#749094]/5 hover:text-[#254153]"
          >
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-xl font-bold text-[#254153]">Solicitar Dispositivo</h2>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-8 py-12">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h1 className="text-3xl font-black text-[#254153] mb-2">Nueva Solicitud</h1>
            <p className="text-[#749094]">Completa la información necesaria para procesar tu requerimiento de equipo.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {/* Solicitado por (Read-only) */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#254153]">
                  <Mail size={16} className="text-[#749094]" />
                  Solicitado por
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-2xl border border-[#749094]/10 bg-[#749094]/5 px-4 py-3.5 text-sm text-[#749094] shadow-none outline-none cursor-not-allowed"
                />
              </div>

              {/* Fecha de Solicitud (Read-only) */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#254153]">
                  <Calendar size={16} className="text-[#749094]" />
                  Fecha de Solicitud
                </label>
                <input
                  type="text"
                  disabled
                  value={new Date().toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  className="w-full rounded-2xl border border-[#749094]/10 bg-[#749094]/5 px-4 py-3.5 text-sm text-[#749094] shadow-none outline-none cursor-not-allowed"
                />
              </div>

              {/* Dispositivo */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#254153]">
                  <Monitor size={16} className="text-[#749094]" />
                  Categoría de Dispositivo <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.dispositivo}
                  onChange={(e) => setFormData({ ...formData, dispositivo: e.target.value })}
                  className="w-full rounded-2xl border border-[#749094]/20 bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:border-[#254153]/30 focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                >
                  <option value="">Selecciona una categoría...</option>
                  {devices.map(device => (
                    <option key={device} value={device}>{device}</option>
                  ))}
                </select>
              </div>

              {/* Condicional para "Otro" */}
              {formData.dispositivo === 'Otro' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#254153]">
                    <PlusCircle size={16} className="text-[#749094]" />
                    ¿Cuál dispositivo? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.otro_dispositivo}
                    onChange={(e) => setFormData({ ...formData, otro_dispositivo: e.target.value })}
                    className="w-full rounded-2xl border border-[#749094]/20 bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:border-[#254153]/30 focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                    placeholder="Ej: Monitor UltraWide"
                  />
                </div>
              )}

              {/* Cantidad */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#254153]">
                  <Hash size={16} className="text-[#749094]" />
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-2xl border border-[#749094]/20 bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:border-[#254153]/30 focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                  placeholder="Ej: 1"
                />
              </div>

              {/* Centro de Costos */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#254153]">
                  <Building2 size={16} className="text-[#749094]" />
                  Centro de Costos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.centro_costos}
                  onChange={(e) => setFormData({ ...formData, centro_costos: e.target.value })}
                  className="w-full rounded-2xl border border-[#749094]/20 bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:border-[#254153]/30 focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                  placeholder="Escribe el centro de costos..."
                />
              </div>

              {/* Cuenta Contable */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#254153]">
                  <Hash size={16} className="text-[#749094]" />
                  Cuenta Contable <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.cuenta_contable}
                  onChange={(e) => setFormData({ ...formData, cuenta_contable: e.target.value })}
                  className="w-full rounded-2xl border border-[#749094]/20 bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:border-[#254153]/30 focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                  placeholder="Escribe la cuenta contable..."
                />
                <p className="text-[10px] text-[#749094] italic mt-1">* Estos campos estarán disponibles próximamente como listas desplegables.</p>
              </div>

              {/* Jefe Aprobador */}
              <SearchableSelect
                label="Jefe que Aprobará"
                icon={<UserCheck size={16} />}
                placeholder="Selecciona al jefe responsable..."
                required
                className="w-full flex items-center justify-between rounded-2xl border border-[#749094]/20 bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                options={jefes.map(jefe => ({
                  id: jefe,
                  label: jefe
                }))}
                value={formData.jefe_aprobador}
                onChange={(val) => setFormData({ ...formData, jefe_aprobador: val.toString() })}
              />

              {/* Comentario */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#254153]">
                  <MessageSquare size={16} className="text-[#749094]" />
                  Comentario
                </label>
                <textarea
                  rows={4}
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                  className="w-full rounded-2xl border border-[#749094]/20 bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:border-[#254153]/30 focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                  placeholder="Justifica tu solicitud o añade detalles adicionales..."
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[#254153] py-4 text-sm font-bold text-white shadow-xl shadow-[#254153]/20 transition-all hover:scale-[1.02] hover:bg-[#1a2e3b] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando Solicitud...
                  </span>
                ) : (
                  'Enviar Solicitud de Dispositivo'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
