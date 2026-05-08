'use client'

import { useState } from 'react'
import { 
  Search, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Hash,
  User,
  Monitor,
  Building2,
  MessageSquare,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { LogoFPK } from '@/components/LogoFPK'

export default function TrackRequestPage() {
  const [ticketId, setTicketId] = useState('')
  const [loading, setLoading] = useState(false)
  const [request, setRequest] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketId.trim()) return

    setLoading(true)
    setError(null)
    setRequest(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('ti_solicitudes_dispositivos')
        .select('*')
        .ilike('ticket_number', ticketId.trim())
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('No se encontró ninguna solicitud con ese ID. Por favor verifica el número.')
        }
        throw fetchError
      }

      setRequest(data)
    } catch (err: any) {
      console.error('Error tracking request:', err)
      setError(err.message || 'Ocurrió un error al buscar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return { 
          icon: <Clock className="text-amber-500" />, 
          bg: 'bg-amber-50', 
          border: 'border-amber-100',
          text: 'text-amber-700',
          label: 'En Revisión'
        }
      case 'aprobado':
        return { 
          icon: <CheckCircle2 className="text-emerald-500" />, 
          bg: 'bg-emerald-50', 
          border: 'border-emerald-100',
          text: 'text-emerald-700',
          label: 'Aprobado'
        }
      case 'rechazado':
        return { 
          icon: <AlertCircle className="text-rose-500" />, 
          bg: 'bg-rose-50', 
          border: 'border-rose-100',
          text: 'text-rose-700',
          label: 'Rechazado'
        }
      default:
        return { 
          icon: <Clock className="text-slate-500" />, 
          bg: 'bg-slate-50', 
          border: 'border-slate-100',
          text: 'text-slate-700',
          label: estado
        }
    }
  }

  const status = getStatusConfig(request?.estado)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-[#254153]/5 blur-[100px]" />
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] rounded-full bg-[#749094]/5 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 py-12 lg:py-20">
        <div className="flex flex-col items-center mb-12 text-center">
          <LogoFPK className="w-40 h-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-500" />
          <h1 className="text-4xl font-black text-[#254153] mb-4">Seguimiento de Solicitud</h1>
          <p className="text-[#749094] max-w-md">Ingresa el ID de tu solicitud para conocer el estado actual de tu requerimiento.</p>
        </div>

        <form onSubmit={handleTrack} className="mb-12">
          <div className="relative group">
            <input
              type="text"
              placeholder="Ej: REQ-00001"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value.toUpperCase())}
              className="w-full h-20 pl-8 pr-40 rounded-[2.5rem] border-2 border-[#254153]/10 bg-white text-xl font-bold text-[#254153] transition-all focus:border-[#254153] focus:ring-8 focus:ring-[#254153]/5 focus:outline-none placeholder:text-[#749094]/30"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !ticketId}
              className="absolute right-3 top-3 h-14 px-8 rounded-full bg-[#254153] text-white font-bold transition-all hover:bg-[#1a2e3b] active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              <span>Buscar</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-3xl bg-rose-50 border border-rose-100 p-6 flex items-center gap-4 text-rose-600 animate-in fade-in zoom-in duration-300">
            <div className="p-3 rounded-2xl bg-white shadow-sm">
              <AlertCircle size={24} />
            </div>
            <p className="font-bold">{error}</p>
          </div>
        )}

        {request && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            {/* Status Card */}
            <div className={`p-8 rounded-[3rem] border ${status.border} ${status.bg} relative overflow-hidden shadow-xl`}>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-widest text-[#254153]/40">Estado Actual</span>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white shadow-sm">
                      {status.icon}
                    </div>
                    <span className={`text-2xl font-black ${status.text}`}>{status.label}</span>
                  </div>
                </div>
                <div className="h-px w-full md:w-px md:h-12 bg-[#254153]/10" />
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-widest text-[#254153]/40">Ticket ID</span>
                  <div className="text-2xl font-black text-[#254153] tracking-tighter">{request.ticket_number}</div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="p-10 rounded-[3rem] bg-white border border-[#254153]/5 shadow-2xl">
              <h3 className="text-lg font-black text-[#254153] mb-8 pb-4 border-b border-slate-50 uppercase tracking-tighter">Detalles de la Solicitud</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <DetailItem 
                  icon={<User size={18} />} 
                  label="Solicitante" 
                  value={request.nombre_solicitante || request.email_solicitante} 
                />
                <DetailItem 
                  icon={<Monitor size={18} />} 
                  label="Equipo Solicitado" 
                  value={`${request.cantidad}x ${request.dispositivo}`} 
                />
                <DetailItem 
                  icon={<Building2 size={18} />} 
                  label="Centro de Costos" 
                  value={request.centro_costos} 
                />
                <DetailItem 
                  icon={<Hash size={18} />} 
                  label="Cuenta Contable" 
                  value={request.cuenta_contable} 
                />
              </div>

              {request.comentario && (
                <div className="mt-10 p-6 rounded-3xl bg-slate-50 border border-slate-100/50">
                  <label className="flex items-center gap-2 text-xs font-black text-[#254153]/40 uppercase tracking-widest mb-3">
                    <MessageSquare size={14} />
                    Observaciones
                  </label>
                  <p className="text-[#254153] leading-relaxed italic">"{request.comentario}"</p>
                </div>
              )}

              {request.comentario_admin && (
                <div className="mt-6 p-6 rounded-3xl bg-[#254153]/5 border border-[#254153]/10">
                  <label className="flex items-center gap-2 text-xs font-black text-[#254153] uppercase tracking-widest mb-3">
                    <UserCheck size={14} />
                    Respuesta de TI
                  </label>
                  <p className="text-[#254153] font-bold leading-relaxed">"{request.comentario_admin}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-20 text-center">
          <Link 
            href="/public/inventory/request"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#749094] transition-all hover:text-[#254153] group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Volver a Nueva Solicitud
          </Link>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="space-y-2">
      <span className="flex items-center gap-2 text-xs font-black text-[#254153]/30 uppercase tracking-widest">
        {icon}
        {label}
      </span>
      <p className="text-[#254153] font-bold text-lg">{value}</p>
    </div>
  )
}
